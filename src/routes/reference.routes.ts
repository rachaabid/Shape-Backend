import { Router } from 'express';
import { authMiddleware as auth } from '../middleware/auth.middleware';
import {
  career,
  hardSkill, softSkill, softwareSkill, focusedSkill, jobOfferModel,
  countSoftwareSkillHandler, countFocusedSkillHandler, countHardSkillHandler,
} from '../controllers/reference.controller';

const router = Router();

// ── Career ────────────────────────────────────────────────────────────────────
router.get('/Career/archived',                                   auth, career.getArchived);
router.get('/Career/count',                                      career.count);
router.get('/Career/byattribute/:attributeName/:value',          career.getByAttribute);
router.get('/Career/ByAttributeCount/:attributeName/:value',     career.countByAttribute);
router.get('/Career/:id',      career.getById);
router.get('/Career',          career.getAll);
router.post('/Career',         auth, career.create);
router.put('/Career',          auth, career.update);
router.patch('/Career/:id/archive',   auth, career.archive);
router.patch('/Career/:id/unarchive', auth, career.unarchive);
router.patch('/Career/:id',    auth, career.patch);
router.patch('/Career',        auth, career.patch);
router.delete('/Career/:id',   auth, career.remove);

// ── HardSkill ─────────────────────────────────────────────────────────────────
router.get('/HardSkill/archived',                                   auth, hardSkill.getArchived);
router.get('/HardSkill/count',                                      hardSkill.count);
router.get('/HardSkill/countSoftwareSkill',                         countSoftwareSkillHandler);
router.get('/HardSkill/byattribute/:attributeName/:value',          hardSkill.getByAttribute);
router.get('/HardSkill/ByAttributeCount/:attributeName/:value',     hardSkill.countByAttribute);
router.get('/HardSkill/:id',    hardSkill.getById);
router.get('/HardSkill',        hardSkill.getAll);
router.post('/HardSkill',       auth, hardSkill.create);
router.put('/HardSkill',        auth, hardSkill.update);
router.patch('/HardSkill/:id/archive',   auth, hardSkill.archive);
router.patch('/HardSkill/:id/unarchive', auth, hardSkill.unarchive);
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
router.get('/SoftwareSkill/archived',                                   auth, softwareSkill.getArchived);
router.get('/SoftwareSkill/count',                                      softwareSkill.count);
router.get('/SoftwareSkill/countFocusedSkill',                          countFocusedSkillHandler);
router.get('/SoftwareSkill/byattribute/:attributeName/:value',          softwareSkill.getByAttribute);
router.get('/SoftwareSkill/ByAttributeCount/:attributeName/:value',     softwareSkill.countByAttribute);
router.get('/SoftwareSkill/:id',    softwareSkill.getById);
router.get('/SoftwareSkill',        softwareSkill.getAll);
router.post('/SoftwareSkill',       auth, softwareSkill.create);
router.put('/SoftwareSkill',        auth, softwareSkill.update);
router.patch('/SoftwareSkill/:id/archive',   auth, softwareSkill.archive);
router.patch('/SoftwareSkill/:id/unarchive', auth, softwareSkill.unarchive);
router.patch('/SoftwareSkill/:id',  auth, softwareSkill.patch);
router.patch('/SoftwareSkill',      auth, softwareSkill.patch);
router.delete('/SoftwareSkill/:id', auth, softwareSkill.remove);

// ── FocusedSkill ──────────────────────────────────────────────────────────────
router.get('/FocusedSkill/archived',                                   auth, focusedSkill.getArchived);
router.get('/FocusedSkill/count',                                      focusedSkill.count);
router.get('/FocusedSkill/countHardSkill',                             countHardSkillHandler);
router.get('/FocusedSkill/byattribute/:attributeName/:value',          focusedSkill.getByAttribute);
router.get('/FocusedSkill/ByAttributeCount/:attributeName/:value',     focusedSkill.countByAttribute);
router.get('/FocusedSkill/:id',    focusedSkill.getById);
router.get('/FocusedSkill',        focusedSkill.getAll);
router.post('/FocusedSkill',       auth, focusedSkill.create);
router.put('/FocusedSkill',        auth, focusedSkill.update);
router.patch('/FocusedSkill/:id/archive',   auth, focusedSkill.archive);
router.patch('/FocusedSkill/:id/unarchive', auth, focusedSkill.unarchive);
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
