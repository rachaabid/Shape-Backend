import { HttpError } from '../../utils/HttpError';

/**
 * Représente une fenêtre temporelle pour les calculs BI ainsi que sa fenêtre
 * précédente (utilisée pour calculer les deltas).
 *
 * - Si `from`/`to` sont fournis → plage personnalisée (period = 'custom').
 * - Sinon → fenêtre prédéfinie (7d / 30d / 90d / year).
 */
export class BiPeriod {
  static readonly PRESET_DAYS: Record<string, number> = {
    '7d': 7, '30d': 30, '90d': 90, 'year': 365,
  };

  readonly label:       string;
  readonly periodStart: Date;
  readonly periodEnd:   Date;
  readonly prevStart:   Date;
  readonly days:        number;
  readonly dayFormat:   string;

  private constructor(label: string, start: Date, end: Date) {
    this.label       = label;
    this.periodStart = start;
    this.periodEnd   = end;
    const spanMs     = end.getTime() - start.getTime();
    this.days        = Math.max(1, Math.round(spanMs / 86_400_000));
    this.prevStart   = new Date(start.getTime() - spanMs);
    this.dayFormat   = this.days <= 31 ? '%Y-%m-%d' : '%Y-%m';
  }

  static fromQuery(query: { period?: string; from?: string; to?: string }): BiPeriod {
    if (query.from && query.to) {
      const start = new Date(query.from);
      const end   = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        throw HttpError.badRequest('Plage de dates invalide.');
      }
      return new BiPeriod('custom', start, end);
    }

    const preset = query.period && BiPeriod.PRESET_DAYS[query.period] ? query.period : '30d';
    const days   = BiPeriod.PRESET_DAYS[preset];
    const end    = new Date();
    const start  = new Date(end.getTime() - days * 86_400_000);
    return new BiPeriod(preset, start, end);
  }

  /** Filtre Mongo "dans la plage courante". */
  get inRange(): Record<string, unknown> {
    return { $gte: this.periodStart, $lt: this.periodEnd };
  }

  /** Filtre Mongo "dans la plage précédente" (même longueur, juste avant). */
  get inPrev(): Record<string, unknown> {
    return { $gte: this.prevStart, $lt: this.periodStart };
  }
}

/** Variation en pourcentage entre `curr` et `prev`. Robuste à prev=0. */
export const computeDelta = (curr: number, prev: number): number => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
};
