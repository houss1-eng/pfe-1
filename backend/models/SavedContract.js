const mongoose = require('mongoose');

const savedContractSchema = new mongoose.Schema({
  chefId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chefEmail:   { type: String, required: true },
  clientEmail: { type: String, required: true },
  ref:         { type: String, required: true },
  formData:    { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SavedContract', savedContractSchema);
