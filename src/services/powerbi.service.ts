/**
 * Intégration Power BI Embedded.
 *
 * Flux global :
 *   1. Obtenir un access-token Azure AD (client_credentials, scope Power BI).
 *   2. À la 1ʳᵉ exécution, créer un "push dataset" `Shape KPIs` dans le
 *      workspace cible si aucun dataset du même nom n'existe.
 *   3. Pousser les KPI courants (issus de stats.controller) sous forme de
 *      lignes dans les tables de ce dataset.
 *   4. Pour le front : émettre un embed-token + URL d'intégration pour que
 *      `powerbi-client-angular` rende le rapport.
 *
 * Variables d'environnement requises (toutes obligatoires côté Azure) :
 *   AZURE_TENANT_ID
 *   AZURE_CLIENT_ID
 *   AZURE_CLIENT_SECRET
 *   POWERBI_WORKSPACE_ID            -> ID du workspace (group) Power BI
 *   POWERBI_REPORT_ID    (option.)  -> ID du rapport pour l'embed
 *   POWERBI_DATASET_NAME (option.)  -> défaut : "Shape KPIs"
 */
import axios from 'axios';

const TOKEN_URL = (tenant: string) =>
  `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
const API_BASE  = 'https://api.powerbi.com/v1.0/myorg';

const DATASET_NAME = process.env['POWERBI_DATASET_NAME'] || 'Shape KPIs';

/** Cache du token AAD (expire au bout de ~1h). */
interface CachedToken { token: string; expiresAt: number; }
let cached: CachedToken | null = null;

/** Cache de l'ID du dataset pour éviter une requête à chaque push. */
let datasetIdCache: string | null = null;

function readConfig() {
  const tenant       = process.env['AZURE_TENANT_ID'];
  const clientId     = process.env['AZURE_CLIENT_ID'];
  const clientSecret = process.env['AZURE_CLIENT_SECRET'];
  const workspaceId  = process.env['POWERBI_WORKSPACE_ID'];
  if (!tenant || !clientId || !clientSecret || !workspaceId) {
    throw new Error(
      'Power BI non configuré. Renseignez AZURE_TENANT_ID, AZURE_CLIENT_ID, '
      + 'AZURE_CLIENT_SECRET et POWERBI_WORKSPACE_ID dans .env.',
    );
  }
  return { tenant, clientId, clientSecret, workspaceId };
}

/** Indique si Power BI est configuré côté .env (sans lever d'exception). */
export function isPowerBiConfigured(): boolean {
  return !!(
    process.env['AZURE_TENANT_ID'] &&
    process.env['AZURE_CLIENT_ID'] &&
    process.env['AZURE_CLIENT_SECRET'] &&
    process.env['POWERBI_WORKSPACE_ID']
  );
}

/** Obtient (ou réutilise) un access-token Azure AD pour l'API Power BI. */
async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const { tenant, clientId, clientSecret } = readConfig();
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         'https://analysis.windows.net/powerbi/api/.default',
  });
  const { data } = await axios.post<{ access_token: string; expires_in: number }>(
    TOKEN_URL(tenant), body.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  cached = {
    token:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset : création / lookup
// ─────────────────────────────────────────────────────────────────────────────

/** Schéma du push-dataset "Shape KPIs". */
const DATASET_SCHEMA = {
  name: DATASET_NAME,
  defaultMode: 'Push',
  tables: [
    {
      name: 'KpiSnapshot',
      columns: [
        { name: 'timestamp',          dataType: 'DateTime' },
        { name: 'totalUsers',         dataType: 'Int64'    },
        { name: 'candidates',         dataType: 'Int64'    },
        { name: 'companies',          dataType: 'Int64'    },
        { name: 'mentors',            dataType: 'Int64'    },
        { name: 'newUsersThisMonth',  dataType: 'Int64'    },
        { name: 'pendingValidation',  dataType: 'Int64'    },
        { name: 'offersTotal',        dataType: 'Int64'    },
        { name: 'offersOpen',         dataType: 'Int64'    },
        { name: 'applicationsTotal',  dataType: 'Int64'    },
        { name: 'applicationsHired',  dataType: 'Int64'    },
        { name: 'conversionRate',     dataType: 'Double'   },
        { name: 'retentionRate',      dataType: 'Double'   },
        { name: 'avgMatchScore',      dataType: 'Double'   },
        { name: 'completionRate',     dataType: 'Double'   },
        { name: 'avgEvalScore',       dataType: 'Double'   },
        { name: 'upcomingInterviews', dataType: 'Int64'    },
        { name: 'activeMentors',      dataType: 'Int64'    },
      ],
    },
    {
      name: 'Registrations',
      columns: [
        { name: 'timestamp', dataType: 'DateTime' },
        { name: 'month',     dataType: 'string'   },
        { name: 'count',     dataType: 'Int64'    },
      ],
    },
    {
      name: 'Countries',
      columns: [
        { name: 'timestamp', dataType: 'DateTime' },
        { name: 'country',   dataType: 'string'   },
        { name: 'count',     dataType: 'Int64'    },
      ],
    },
    {
      name: 'TopPrograms',
      columns: [
        { name: 'timestamp', dataType: 'DateTime' },
        { name: 'title',     dataType: 'string'   },
        { name: 'count',     dataType: 'Int64'    },
      ],
    },
  ],
};

/** Cherche le dataset par nom ; renvoie son ID ou null. */
async function findDatasetId(token: string, workspaceId: string): Promise<string | null> {
  const { data } = await axios.get<{ value: { id: string; name: string }[] }>(
    `${API_BASE}/groups/${workspaceId}/datasets`,
    { headers: authHeader(token) },
  );
  const ds = data.value.find(d => d.name === DATASET_NAME);
  return ds?.id ?? null;
}

/** Crée le dataset push "Shape KPIs" dans le workspace. */
async function createDataset(token: string, workspaceId: string): Promise<string> {
  const { data } = await axios.post<{ id: string }>(
    `${API_BASE}/groups/${workspaceId}/datasets?defaultRetentionPolicy=basicFIFO`,
    DATASET_SCHEMA,
    { headers: authHeader(token) },
  );
  return data.id;
}

/** Récupère (ou crée) l'ID du dataset "Shape KPIs". */
async function getDatasetId(): Promise<string> {
  if (datasetIdCache) return datasetIdCache;
  const { workspaceId } = readConfig();
  const token = await getAccessToken();
  let id = await findDatasetId(token, workspaceId);
  if (!id) id = await createDataset(token, workspaceId);
  datasetIdCache = id;
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Push de données
// ─────────────────────────────────────────────────────────────────────────────

interface AnyStats {
  users:        any;
  offers:       any;
  applications: any;
  interviews:   any;
  formation:    any;
  registrations?: { month: string; count: number }[];
  countries?:     { country: string; count: number }[];
  topPrograms?:   { title: string; count: number }[];
}

/** Pousse un snapshot KPI complet dans le dataset. */
export async function pushKpiSnapshot(stats: AnyStats): Promise<void> {
  const { workspaceId } = readConfig();
  const token     = await getAccessToken();
  const datasetId = await getDatasetId();
  const timestamp = new Date().toISOString();

  const pushRows = async (table: string, rows: any[]) => {
    if (!rows.length) return;
    await axios.post(
      `${API_BASE}/groups/${workspaceId}/datasets/${datasetId}/tables/${table}/rows`,
      { rows },
      { headers: authHeader(token) },
    );
  };

  const snapshotRow = {
    timestamp,
    totalUsers:         stats.users?.total            || 0,
    candidates:         stats.users?.candidates       || 0,
    companies:          stats.users?.companies        || 0,
    mentors:            stats.users?.mentors          || 0,
    newUsersThisMonth:  stats.users?.newThisMonth     || 0,
    pendingValidation:  stats.users?.pendingValidation || 0,
    offersTotal:        stats.offers?.total           || 0,
    offersOpen:         stats.offers?.open            || 0,
    applicationsTotal:  stats.applications?.total     || 0,
    applicationsHired:  stats.applications?.hired     || 0,
    conversionRate:     stats.applications?.conversionRate || 0,
    retentionRate:      stats.applications?.retentionRate  || 0,
    avgMatchScore:      stats.applications?.avgMatchScore  || 0,
    completionRate:     stats.formation?.completionRate || 0,
    avgEvalScore:       stats.formation?.avgEvalScore   || 0,
    upcomingInterviews: stats.interviews?.upcoming      || 0,
    activeMentors:      stats.formation?.activeMentors  || 0,
  };

  await pushRows('KpiSnapshot', [snapshotRow]);

  if (stats.registrations?.length) {
    await pushRows('Registrations',
      stats.registrations.map(r => ({ timestamp, month: r.month, count: r.count })),
    );
  }
  if (stats.countries?.length) {
    await pushRows('Countries',
      stats.countries.map(c => ({ timestamp, country: c.country, count: c.count })),
    );
  }
  if (stats.topPrograms?.length) {
    await pushRows('TopPrograms',
      stats.topPrograms.map(p => ({ timestamp, title: p.title, count: p.count })),
    );
  }
}

/** Vide les tables du dataset (utile avant un nouveau push complet). */
export async function clearKpiSnapshot(): Promise<void> {
  const { workspaceId } = readConfig();
  const token     = await getAccessToken();
  const datasetId = await getDatasetId();
  for (const table of ['KpiSnapshot', 'Registrations', 'Countries', 'TopPrograms']) {
    await axios.delete(
      `${API_BASE}/groups/${workspaceId}/datasets/${datasetId}/tables/${table}/rows`,
      { headers: authHeader(token) },
    ).catch(() => undefined);   // table peut ne pas exister
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Embed token (côté front)
// ─────────────────────────────────────────────────────────────────────────────

export interface EmbedInfo {
  embedUrl:   string;
  accessToken: string;
  reportId:   string;
  expiresOn:  string;
}

/**
 * Génère un embed-token pour un rapport (POWERBI_REPORT_ID) ou — par défaut —
 * pour le 1ᵉʳ rapport du workspace. Le token est destiné au navigateur, il a
 * une durée de vie courte (≤ 1h).
 */
export async function getEmbedInfo(): Promise<EmbedInfo> {
  const { workspaceId } = readConfig();
  const token = await getAccessToken();
  const reportId = process.env['POWERBI_REPORT_ID'];

  // 1. Identifier le rapport
  let report: { id: string; embedUrl: string; datasetId: string };
  if (reportId) {
    const { data } = await axios.get<{ id: string; embedUrl: string; datasetId: string }>(
      `${API_BASE}/groups/${workspaceId}/reports/${reportId}`,
      { headers: authHeader(token) },
    );
    report = data;
  } else {
    const { data } = await axios.get<{ value: { id: string; embedUrl: string; datasetId: string }[] }>(
      `${API_BASE}/groups/${workspaceId}/reports`,
      { headers: authHeader(token) },
    );
    if (!data.value.length) {
      throw new Error(
        'Aucun rapport trouvé dans ce workspace. Créez un rapport sur le dataset '
        + `"${DATASET_NAME}" dans Power BI Service avant de continuer.`,
      );
    }
    report = data.value[0];
  }

  // 2. Générer l'embed-token
  const { data: tokenData } = await axios.post<{ token: string; expiration: string }>(
    `${API_BASE}/groups/${workspaceId}/reports/${report.id}/GenerateToken`,
    { accessLevel: 'View' },
    { headers: authHeader(token) },
  );

  return {
    embedUrl:    report.embedUrl,
    accessToken: tokenData.token,
    reportId:    report.id,
    expiresOn:   tokenData.expiration,
  };
}
