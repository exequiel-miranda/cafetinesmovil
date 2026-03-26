import express from 'express';
const router = express.Router();
import { getAll, getById, create } from '../controlers/categoryController.js';

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);

export default router;
