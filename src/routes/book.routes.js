import { Router } from 'express';
import * as book from '../controllers/book.controller.js';

const router = Router();

router.get('/', book.listBooks);
router.post('/', book.createBook);
router.post('/:id/chapters', book.addChapter);
router.post('/:id/records', book.addRecord);

export default router;
