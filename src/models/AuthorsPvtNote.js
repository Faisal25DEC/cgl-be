// src/models/AuthorsPvtNote.js
// Minimal ESM Mongoose schema focused ONLY on the requested fields.
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Authors PVT Note Schema (diet version)
 * Fields per user request:
 *  - Record No
 *  - BookNO
 *  - Chapter No
 *  - Contents
 */
const AuthorsPvtNoteSchema = new Schema({
  recordNo:   { type: Number, required: true, index: true }, // Record No (note id in your world)
  bookNo:     { type: Number, required: true, index: true }, // BookNO
  chapterNo:  { type: Number, required: true, index: true }, // Chapter No
  contents:   { type: String, required: true, trim: true },  // Contents
}, { timestamps: true, versionKey: 'rev' });

// Prevent accidental duplicates for the same location+record number
AuthorsPvtNoteSchema.index({ bookNo: 1, chapterNo: 1, recordNo: 1 }, { unique: true });

export default model('AuthorsPvtNote', AuthorsPvtNoteSchema);
