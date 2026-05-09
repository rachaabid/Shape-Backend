import { Router } from 'express';
import {
  getLanguages, getCountries, getHardSkills, getSoftwareSkills,
  getFocusedSkills, getWorkingModeById, getWorkingModes,
  getJobOfferModelById, getCareers,
} from '../controllers/reference.controller';

const router = Router();

// Public reference routes (needed for registration forms + dropdowns)
router.get('/Language',          getLanguages);
router.get('/Country',           getCountries);
router.get('/HardSkill',         getHardSkills);
router.get('/SoftwareSkill',     getSoftwareSkills);
router.get('/FocusedSkill',      getFocusedSkills);
router.get('/WorkingMode',       getWorkingModes);
router.get('/WorkingMode/:id',   getWorkingModeById);
router.get('/JobOfferModel/:id', getJobOfferModelById);
router.get('/Career',            getCareers);

export default router;
