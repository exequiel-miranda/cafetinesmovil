import express from 'express';
import { getConfig, updateConfig } from '../controlers/configController.js';

const router = express.Router();

router.get('/', getConfig);
router.patch('/', updateConfig);

export default router;
