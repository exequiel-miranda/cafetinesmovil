import express from 'express';
const router = express.Router();
import { getAll, getById, create, update, remove } from '../controlers/supplierController.js';

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
