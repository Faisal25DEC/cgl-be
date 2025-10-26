// src/models/DocInsert.js
// Minimal ESM Mongoose schema focused ONLY on the requested fields.
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Doc Insert Schema (diet version)
 * Fields per user request:
 *  - After Book No
 *  - After Chapter No
 *  - After Record No
 *  - Reason for Inserting
 */
const DocInsertSchema = new Schema({
  afterBookNo:    { type: Number, required: true, index: true },  // After Book No
  afterChapterNo: { type: Number, required: true, index: true },  // After Chapter No
  afterRecordNo:  { type: Number, required: true, index: true },  // After Record No
  reason:         { type: String, required: true, trim: true },   // Reason for Inserting
}, { timestamps: true, versionKey: 'rev' });

// Optional de-dup protection if you don't want duplicate identical inserts:
DocInsertSchema.index(
  { afterBookNo: 1, afterChapterNo: 1, afterRecordNo: 1, reason: 1 },
  { unique: false }
);

export default model('DocInsert', DocInsertSchema);
