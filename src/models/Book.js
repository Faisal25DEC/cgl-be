// src/models/Book.js
// Final single-option schema per Raj — compact, modern, production-ready.
// Numbering philosophy: Book No (001–999), Record No as recMajor.recMinor (000.00–999.99).
// No Western-publication assumptions; only what we need.

import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Workflow states (adjust labels anytime without changing logic)
export const BookStatus = ['draft', 'review', 'published', 'archived'];

// Local slugify (no external dependency)
function toSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const BookSchema = new Schema(
  {
    // Identity of the book (simple integer range 1..999)
    bookNo:    { type: Number, required: true, min: 1, max: 999, index: true },
    bkGroupNo: { type: Number, default: null, index: true }, // optional grouping for your collections

    // Human title + intro
    bookTitle: { type: String, required: true, trim: true, minlength: 1, maxlength: 220 },
    bookIntro: { type: String, trim: true, default: '' },

    // Per‑book record numbering (000.00). Two numeric columns for perfect sort & queries.
    recMajor:  { type: Number, required: true, min: 0, max: 999 }, // left part
    recMinor:  { type: Number, required: true, min: 0, max: 99  }, // right part

    // Practical enhancements
    slug:      { type: String, required: true, lowercase: true, trim: true }, // unique, readable id
    status:    { type: String, enum: BookStatus, default: 'draft', index: true },
  },
  {
    timestamps: true,
    versionKey: 'rev',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// ---- Virtuals ----

// Display/accept record number as "000.00"
BookSchema.virtual('recordNo')
  .get(function () {
    const left = String(this.recMajor ?? 0).padStart(3, '0');
    const right = String(this.recMinor ?? 0).padStart(2, '0');
    return `${left}.${right}`;
  })
  .set(function (v) {
    if (v === undefined || v === null) return;
    const str = String(v).trim();
    const m = str.match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
    if (m) {
      this.recMajor = parseInt(m[1], 10);
      this.recMinor = parseInt(m[2] ?? '0', 10);
    } else if (!Number.isNaN(Number(str))) {
      this.recMajor = parseInt(str, 10);
      this.recMinor = 0;
    }
  });

// Derived numeric key (e.g., for client sorting if needed)
BookSchema.virtual('recordKey').get(function () {
  return (this.recMajor ?? 0) * 100 + (this.recMinor ?? 0);
});

// ---- Indexes ----

// Ensure no duplicate record numbers inside the same book
BookSchema.index({ bookNo: 1, recMajor: 1, recMinor: 1 }, { unique: true });
// Unique readable id for routing/links
BookSchema.index({ slug: 1 }, { unique: true });
// Helpful filter for grouped browsing
BookSchema.index({ bkGroupNo: 1, bookNo: 1 });

// ---- Hooks ----

// Normalize/auto-generate slug
BookSchema.pre('validate', function (next) {
  if (!this.slug && this.bookTitle) this.slug = toSlug(this.bookTitle);
  if (this.slug) this.slug = toSlug(this.slug);
  next();
});

// ---- Statics (helpers) ----
BookSchema.statics.formatRecordNo = function (recMajor, recMinor = 0) {
  const left = String(recMajor ?? 0).padStart(3, '0');
  const right = String(recMinor ?? 0).padStart(2, '0');
  return `${left}.${right}`;
};

BookSchema.statics.parseRecordNo = function (v) {
  const str = String(v ?? '').trim();
  const m = str.match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  return { recMajor: parseInt(m[1], 10), recMinor: parseInt(m[2] ?? '0', 10) };
};

// Build a Mongo filter for a record range inside a book (inclusive)
BookSchema.statics.rangeFilter = function (bookNo, fromRec = '000.00', toRec = '999.99') {
  const parse = this.parseRecordNo;
  const a = parse(fromRec) || { recMajor: 0, recMinor: 0 };
  const b = parse(toRec)   || { recMajor: 999, recMinor: 99 };
  return {
    bookNo,
    $or: [
      { recMajor: { $gt: a.recMajor, $lt: b.recMajor } },
      { recMajor: a.recMajor, recMinor: { $gte: a.recMinor } },
      { recMajor: b.recMajor, recMinor: { $lte: b.recMinor } },
    ],
  };
};

export default model('Book', BookSchema);

