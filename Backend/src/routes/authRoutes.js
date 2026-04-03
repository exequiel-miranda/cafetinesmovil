import express from 'express';
import { register, login, forgotPassword, resetPassword, requestAdminCode, updateProfile } from '../controlers/authController.js';

const router = express.Router();

router.post('/request-admin-code', requestAdminCode);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/profile', updateProfile);

export default router;
