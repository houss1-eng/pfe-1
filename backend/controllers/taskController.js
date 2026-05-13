const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'client') {
      filter.clientEmail = req.user.email;
    }
    const { status, statuses, priority, search } = req.query;
    if (statuses) filter.status = { $in: statuses.split(',') };
    else if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search)   filter.title    = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      priority,
      status: 'pending_chef',
      clientEmail: req.user.email,
      log: [{ time: new Date().toLocaleString('fr-FR'), msg: `Projet soumis par ${req.user.name}` }]
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status, logMsg, designerNote, devNote } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Projet introuvable' });

    if (status) task.status = status;
    if (designerNote !== undefined) task.designerNote = designerNote;
    if (devNote !== undefined) task.devNote = devNote;
    
    if (logMsg) {
      task.log.push({ time: new Date().toLocaleString('fr-FR'), msg: logMsg });
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
