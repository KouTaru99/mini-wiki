import { Router } from 'express';
import * as tags from '../controllers/tags.controller.js';

const router = Router();

router.get('/', tags.list);
router.post('/', tags.create);
router.delete('/:id', tags.remove);

export default router;
