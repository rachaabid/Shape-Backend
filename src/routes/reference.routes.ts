import { Router } from 'express';
import {
  getLanguages, getCountries, getHardSkills, getSoftwareSkills,
  getFocusedSkills, getPrograms, getWorkingModeById, getWorkingModes,
  getJobOfferModelById,
} from '../controllers/reference.controller';

const router = Router();

// All reference routes are public (needed for registration forms)
router.get('/Language',           getLanguages);
router.get('/Country',            getCountries);
router.get('/HardSkill',          getHardSkills);
router.get('/SoftwareSkill',      getSoftwareSkills);
router.get('/FocusedSkill',       getFocusedSkills);
router.get('/Program',            getPrograms);
router.get('/WorkingMode',        getWorkingModes);
router.get('/WorkingMode/:id',    getWorkingModeById);
router.get('/JobOfferModel/:id',  getJobOfferModelById);

export default router;
