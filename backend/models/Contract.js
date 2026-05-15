const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  ref:         { type: String, required: true },
  title:       { type: String, required: true },
  chefId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chefEmail:   { type: String, required: true },
  chefName:    { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientName:  { type: String, required: true },
  pdfFilename:    { type: String },
  signedFilename: { type: String },
  status: {
    type: String,
    enum: ['sent', 'signed', 'completed'],
    default: 'sent',
  },
  sentAt:     { type: Date, default: Date.now },
  signedAt:   { type: Date },
  returnedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
