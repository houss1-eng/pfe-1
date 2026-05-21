const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ message: 'role requis' });
    const notifications = await Notification.find({
      role,
      triggeredByUserId: { $ne: String(req.user.id) },
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length) {
      await Notification.updateMany({ _id: { $in: ids } }, { read: true });
    } else {
      const { role } = req.query;
      if (role) await Notification.updateMany({ role }, { read: true });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
