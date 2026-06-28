import { Router } from 'express';
import * as articles from '../controllers/articles.controller.js';

const router = Router();

router.get('/', articles.list);
router.post('/', articles.create);
router.get('/:slug', articles.getBySlug);
router.put('/:slug', articles.update);
router.delete('/:slug', articles.remove);

export default router;
