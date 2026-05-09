import express from 'express';
import {
  getFormations,
  getFormationById,
  createFormation,
  updateFormation,
  deleteFormation,
  countFormations
} from '../controllers/formation.controller';

const router = express.Router();

router.get('/', getFormations);
router.get('/count', countFormations);
router.get('/:id', getFormationById);
router.post('/', createFormation);
router.put('/', updateFormation);
router.delete('/:id', deleteFormation);

export default router;