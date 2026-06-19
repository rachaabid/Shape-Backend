import { Router } from 'express';
import {
  exportTokenGuard,
  getAllJson,
  getSnapshotCsv,
  getRegistrationsCsv,
  getApplicationsByMonthCsv,
  getCountriesCsv,
  getTopTrainingsCsv,
  getMissingSkillsCsv,
  getScoreDistributionCsv,
  getApplicationStatusCsv,
  getFunnelCsv,
} from '../controllers/biExport.controller';

const router = Router();

// Toutes les routes passent par le token-guard (silencieux si pas de
// POWERBI_EXPORT_TOKEN configuré côté .env)
router.use(exportTokenGuard);

router.get('/',                          getAllJson);
router.get('/snapshot.csv',              getSnapshotCsv);
router.get('/registrations.csv',         getRegistrationsCsv);
router.get('/applications-by-month.csv', getApplicationsByMonthCsv);
router.get('/countries.csv',             getCountriesCsv);
router.get('/top-trainings.csv',          getTopTrainingsCsv);
router.get('/missing-skills.csv',        getMissingSkillsCsv);
router.get('/score-distribution.csv',    getScoreDistributionCsv);
router.get('/application-status.csv',    getApplicationStatusCsv);
router.get('/funnel.csv',                getFunnelCsv);

export default router;
