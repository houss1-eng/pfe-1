const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message:          { type: String, required: true },
  role:             { type: String, required: true },
  taskId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  taskTitle:        { type: String },
  read:             { type: Boolean, default: false },
  triggeredByUserId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
