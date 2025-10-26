import Book from '../models/book.js';
import Chapter from '../models/Chapter.js';
import Record from '../models/Record.js';
import { nextVisible, cmpVisible } from '../utils/numbering.js';

export async function listBooks(req, res) {
  const books = await Book.find({}).sort({ visibleNumber: 1 });
  res.json({ ok: true, data: books });
}

export async function createBook(req, res) {
  const { title } = req.body;
  // Find last book's visibleNumber and step by 5
  const last = await Book.find({}).sort({ visibleNumber: -1 }).limit(1);
  const lastNum = last[0]?.visibleNumber;
  const visibleNumber = nextVisible(lastNum, 5);
  const book = await Book.create({ title, visibleNumber });
  res.status(201).json({ ok: true, data: book });
}

export async function getBook(req, res) {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ ok: false, error: 'Book not found' });
  res.json({ ok: true, data: book });
}

export async function addChapter(req, res) {
  const { title } = req.body;
  const bookId = req.params.id;
  const last = await Chapter.find({ bookId }).sort({ visibleNumber: -1 }).limit(1);
  const lastNum = last[0]?.visibleNumber;
  const visibleNumber = nextVisible(lastNum, 5);
  const chapter = await Chapter.create({ bookId, title, visibleNumber });
  res.status(201).json({ ok: true, data: chapter });
}

export async function addRecord(req, res) {
  const { content, chapterId } = req.body;
  const bookId = req.params.id;
  const last = await Record.find({ bookId }).sort({ visibleNumber: -1 }).limit(1);
  const lastNum = last[0]?.visibleNumber;
  const visibleNumber = nextVisible(lastNum, 10);
  const record = await Record.create({ bookId, chapterId, content, visibleNumber });
  res.status(201).json({ ok: true, data: record });
}
