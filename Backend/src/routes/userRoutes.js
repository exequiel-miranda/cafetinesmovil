import express from 'express';
import { getUsers, updateUserDepartment, deleteUser } from '../controlers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.patch('/:id/department', updateUserDepartment);
router.delete('/:id', deleteUser);

export default router;
