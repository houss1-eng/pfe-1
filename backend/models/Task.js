const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: [
      'new', 'pending_chef', 'assigned_designer', 'in_progress_designer',
      'review_chef_design', 'review_client', 'rejected_client', 'approved_client',
      'assigned_dev', 'in_progress_dev', 'review_chef_dev', 'delivered', 'completed'
    ],
    default: 'pending_chef',
  },
  clientEmail: {
    type: String,
    required: true,
  },
  deadline: { type: Date },
  designerNote: { type: String },
  devNote:      { type: String },
  chefNote:     { type: String },
  designerFiles: [{ name: String, url: String, uploadedAt: String }],
  devFiles:      [{ name: String, url: String, uploadedAt: String }],
  chefFiles:     [{ name: String, url: String, uploadedAt: String }],
  log: [{
    time: String,
    msg: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
