import { Router } from 'express';
import { authMiddleware as auth } from '../middleware/auth.middleware';
import {
  lang, country, career, workingMode,
  hardSkill, softSkill, softwareSkill, focusedSkill, jobOfferModel,
  countSoftwareSkillHandler, countFocusedSkillHandler, countHardSkillHandler,
} from '../controllers/reference.controller';

const router = Router();

// ── Language ──────────────────────────────────────────────────────────────────
router.get('/Language/count',                                    lang.count);
router.get('/Language/byattribute/:attributeName/:value',        lang.getByAttribute);
router.get('/Language/ByAttributeCount/:attributeName/:value',   lang.countByAttribute);
router.get('/Language/:id',    lang.getById);
router.get('/Language',        lang.getAll);
router.post('/Language',       auth, lang.create);
router.put('/Language',        auth, lang.update);
router.patch('/Language/:id',  auth, lang.patch);
router.patch('/Language',      auth, lang.patch);
router.delete('/Language/:id', auth, lang.remove);

// ── Country ───────────────────────────────────────────────────────────────────
router.get('/Country/count',                                     country.count);
router.get('/Country/ByAttribute/:attributeName/:value',         country.getByAttribute);
router.get('/Country/ByAttributeCount/:attributeName/:value',    country.countByAttribute);
router.get('/Country/byattribute/:attributeName/:value',         country.getByAttribute);
router.get('/Country/:id',     country.getById);
router.get('/Country',         country.getAll);
router.post('/Country',        auth, country.create);
router.put('/Country',         auth, country.update);
router.patch('/Country/:id',   auth, country.patch);
router.patch('/Country',       auth, country.patch);
router.delete('/Country/:id',  auth, country.remove);

// ── Career ────────────────────────────────────────────────────────────────────
router.get('/Career/count',                                      career.count);
router.get('/Career/byattribute/:attributeName/:value',          career.getByAttribute);
router.get('/Career/ByAttributeCount/:attributeName/:value',     career.countByAttribute);
router.get('/Career/:id',      career.getById);
router.get('/Career',          career.getAll);
router.post('/Career',         auth, career.create);
router.put('/Career',          auth, career.update);
router.patch('/Career/:id',    auth, career.patch);
router.patch('/Career',        auth, career.patch);
router.delete('/Career/:id',   auth, career.remove);

// ── WorkingMode ───────────────────────────────────────────────────────────────
router.get('/WorkingMode/count',                                      workingMode.count);
router.get('/WorkingMode/byattribute/:attributeName/:value',          workingMode.getByAttribute);
router.get('/WorkingMode/ByAttributeCount/:attributeName/:value',     workingMode.countByAttribute);
router.get('/WorkingMode/:id',    workingMode.getById);
router.get('/WorkingMode',        workingMode.getAll);
router.post('/WorkingMode',       auth, workingMode.create);
router.put('/WorkingMode',        auth, workingMode.update);
router.patch('/WorkingMode/:id',  auth, workingMode.patch);
router.patch('/WorkingMode',      auth, workingMode.patch);
router.delete('/WorkingMode/:id', auth, workingMode.remove);

// ── HardSkill ─────────────────────────────────────────────────────────────────
router.get('/HardSkill/count',                                      hardSkill.count);
router.get('/HardSkill/countSoftwareSkill',                         countSoftwareSkillHandler);
router.get('/HardSkill/byattribute/:attributeName/:value',          hardSkill.getByAttribute);
router.get('/HardSkill/ByAttributeCount/:attributeName/:value',     hardSkill.countByAttribute);
router.get('/HardSkill/:id',    hardSkill.getById);
router.get('/HardSkill',        hardSkill.getAll);
router.post('/HardSkill',       auth, hardSkill.create);
router.put('/HardSkill',        auth, hardSkill.update);
router.patch('/HardSkill/:id',  auth, hardSkill.patch);
router.patch('/HardSkill',      auth, hardSkill.patch);
router.delete('/HardSkill/:id', auth, hardSkill.remove);

// ── SoftSkill ─────────────────────────────────────────────────────────────────
router.get('/SoftSkill/count',                                      softSkill.count);
router.get('/SoftSkill/byattribute/:attributeName/:value',          softSkill.getByAttribute);
router.get('/SoftSkill/ByAttributeCount/:attributeName/:value',     softSkill.countByAttribute);
router.get('/SoftSkill/:id',    softSkill.getById);
router.get('/SoftSkill',        softSkill.getAll);
router.post('/SoftSkill',       auth, softSkill.create);
router.put('/SoftSkill',        auth, softSkill.update);
router.patch('/SoftSkill/:id',  auth, softSkill.patch);
router.patch('/SoftSkill',      auth, softSkill.patch);
router.delete('/SoftSkill/:id', auth, softSkill.remove);

// ── SoftwareSkill ─────────────────────────────────────────────────────────────
router.get('/SoftwareSkill/count',                                      softwareSkill.count);
router.get('/SoftwareSkill/countFocusedSkill',                          countFocusedSkillHandler);
router.get('/SoftwareSkill/byattribute/:attributeName/:value',          softwareSkill.getByAttribute);
router.get('/SoftwareSkill/ByAttributeCount/:attributeName/:value',     softwareSkill.countByAttribute);
router.get('/SoftwareSkill/:id',    softwareSkill.getById);
router.get('/SoftwareSkill',        softwareSkill.getAll);
router.post('/SoftwareSkill',       auth, softwareSkill.create);
router.put('/SoftwareSkill',        auth, softwareSkill.update);
router.patch('/SoftwareSkill/:id',  auth, softwareSkill.patch);
router.patch('/SoftwareSkill',      auth, softwareSkill.patch);
router.delete('/SoftwareSkill/:id', auth, softwareSkill.remove);

// ── FocusedSkill ──────────────────────────────────────────────────────────────
router.get('/FocusedSkill/count',                                      focusedSkill.count);
router.get('/FocusedSkill/countHardSkill',                             countHardSkillHandler);
router.get('/FocusedSkill/byattribute/:attributeName/:value',          focusedSkill.getByAttribute);
router.get('/FocusedSkill/ByAttributeCount/:attributeName/:value',     focusedSkill.countByAttribute);
router.get('/FocusedSkill/:id',    focusedSkill.getById);
router.get('/FocusedSkill',        focusedSkill.getAll);
router.post('/FocusedSkill',       auth, focusedSkill.create);
router.put('/FocusedSkill',        auth, focusedSkill.update);
router.patch('/FocusedSkill/:id',  auth, focusedSkill.patch);
router.patch('/FocusedSkill',      auth, focusedSkill.patch);
router.delete('/FocusedSkill/:id', auth, focusedSkill.remove);

// ── JobOfferModel ─────────────────────────────────────────────────────────────
router.get('/JobOfferModel/count',                                      jobOfferModel.count);
router.get('/JobOfferModel/byattribute/:attributeName/:value',          jobOfferModel.getByAttribute);
router.get('/JobOfferModel/ByAttributeCount/:attributeName/:value',     jobOfferModel.countByAttribute);
router.get('/JobOfferModel/:id',    jobOfferModel.getById);
router.get('/JobOfferModel',        jobOfferModel.getAll);
router.post('/JobOfferModel',       auth, jobOfferModel.create);
router.put('/JobOfferModel',        auth, jobOfferModel.update);
router.patch('/JobOfferModel/:id',  auth, jobOfferModel.patch);
router.patch('/JobOfferModel',      auth, jobOfferModel.patch);
router.delete('/JobOfferModel/:id', auth, jobOfferModel.remove);

export default router;
