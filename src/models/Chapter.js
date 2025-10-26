// src/models/Chapter.js
// ESM Mongoose schema — aligned with Book/Record philosophy, minimal + modern.
// Notes from Excel: red number '2' should be '4' (interpreted as chapterNo starting at 4? We keep general).
// Items 7 & 8: user selects one of four options (dropdown/select). Implemented as enums below.
// Contents logic note: content behavior can depend on option7; we just store choices here.

import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const ChapterStatus = ['draft', 'review', 'published', 'archived'];

// Four-option dropdowns (rename values later if you want exact labels from UI)
export const ChapterContentOption = ['AQ_ONLY', 'TEXT_ONLY', 'TABLE_ONLY', 'MIXED'];
export const ChapterDisplayOption = ['NORMAL', 'HIGHLIGHT', 'APPENDIX', 'HIDDEN'];

function toSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const ChapterSchema = new Schema(
  {
    // Relationship
    bookId:     { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },

    // Identity & ordering (simple, clean)
    chapterNo:  { type: Number, required: true, min: 1, index: true },
    title:      { type: String, required: true, trim: true, minlength: 1, maxlength: 220 },
    slug:       { type: String, required: true, lowercase: true, trim: true },

    // Basic info (aligned with your sheet)
    header:        { type: String, trim: true, default: '' },
    pageHeadNote:  { type: String, trim: true, default: '' },
    showInContents:{ type: Boolean, default: true },
    specialNumbering: { type: String, trim: true, default: '' },
    intro:         { type: String, trim: true, default: '' },

    // Dropdown/selects (items 7 & 8)
    option7: { type: String, enum: ChapterContentOption, default: 'MIXED' },
    option8: { type: String, enum: ChapterDisplayOption, default: 'NORMAL' },

    // Content (kept simple; UI decides based on option7)
    contentHtml: { type: String, default: '' },
    notes:       { type: String, trim: true, default: '' },

    // Status / workflow
    status: { type: String, enum: ChapterStatus, default: 'draft', index: true },

    // Governance
    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' },
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

// Uniqueness within a book
ChapterSchema.index({ bookId: 1, chapterNo: 1 }, { unique: true });
ChapterSchema.index({ bookId: 1, slug: 1 }, { unique: true });

// Auto/normalize slug
ChapterSchema.pre('validate', function(next) {
  if (!this.slug && this.title) this.slug = toSlug(this.title);
  if (this.slug) this.slug = toSlug(this.slug);
  next();
});

export default model('Chapter', ChapterSchema);
