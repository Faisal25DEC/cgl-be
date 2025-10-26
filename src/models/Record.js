// src/models/Record.js
// ESM Mongoose schema — aligned with Book.js numbering (recMajor.recMinor = 000.00).
// Minimal, modern, and dump-ready.

import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const RecordSchema = new Schema(
  {
    bookId:    { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },

    // Optional link (kept flexible; you can remove later if chapter is out of scope for now)
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter' },

    // Numbering within a book: 000.00 -> recMajor(0..999) . recMinor(0..99)
    recMajor:  { type: Number, required: true, min: 0, max: 999 },
    recMinor:  { type: Number, required: true, min: 0, max: 99  },

    // Your content
    content:   { type: String, default: '' },

    // Free-form extra info (tags, flags, anything)
    meta:      { type: Schema.Types.Mixed, default: {} },
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

// Display/accept as "000.00" for human readability
RecordSchema.virtual('visibleNumber')
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

// Derived numeric key for efficient sorts on the client if needed
RecordSchema.virtual('recordKey').get(function () {
  return (this.recMajor ?? 0) * 100 + (this.recMinor ?? 0);
});

// ---- Indexes ----

// Within the same book, prevent duplicate numbers
RecordSchema.index({ bookId: 1, recMajor: 1, recMinor: 1 }, { unique: true });

// ---- Statics (helpers) ----
RecordSchema.statics.formatVisibleNumber = function (recMajor, recMinor = 0) {
  const left = String(recMajor ?? 0).padStart(3, '0');
  const right = String(recMinor ?? 0).padStart(2, '0');
  return `${left}.${right}`;
};

RecordSchema.statics.parseVisibleNumber = function (v) {
  const str = String(v ?? '').trim();
  const m = str.match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  return { recMajor: parseInt(m[1], 10), recMinor: parseInt(m[2] ?? '0', 10) };
};

export default model('Record', RecordSchema);
