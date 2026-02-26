const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    building: { type: String, trim: true },
    floor: { type: String, trim: true },
    areaName: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationSchema.index({ code: 1 }, { unique: true, sparse: true });
locationSchema.index({ isActive: 1, areaName: 1 });

module.exports = mongoose.model('Location', locationSchema);
