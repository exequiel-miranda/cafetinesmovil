import express from 'express';
const router = express.Router();
import { getAll, getFeatured, getById, create, update } from '../controlers/productController.js';

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);

export default router;
