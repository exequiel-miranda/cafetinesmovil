import express from 'express';
const router = express.Router();
import { getAll, getById, create, updateStatus, remove } from '../controlers/orderController.js';

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

export default router;
