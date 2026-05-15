const Task         = require('../models/Task');
const Notification = require('../models/Notification');

// Each status maps to one or more { role, msg } targets
const STATUS_NOTIFICATIONS = {
  pending_chef:          [{ role: 'chef',      msg: (t) => `📋 Nouveau projet soumis : "${t.title}"` }],
  assigned_designer:     [{ role: 'designer',  msg: (t) => `🎨 Projet assigné : "${t.title}"` }],
  review_chef_design:    [{ role: 'chef',      msg: (t) => `🖼️ Design prêt pour révision : "${t.title}"` }],
  review_client:         [{ role: 'client',    msg: (t) => `👀 Votre projet est prêt pour révision : "${t.title}"` }],
  rejected_client:       [{ role: 'chef',      msg: (t) => `🔄 Le client a demandé une révision : "${t.title}"` }],
  approved_client:       [{ role: 'chef',      msg: (t) => `✅ Le client a approuvé : "${t.title}"` }],
  assigned_dev:          [{ role: 'developer', msg: (t) => `💻 Projet assigné au développement : "${t.title}"` }],
  review_chef_dev:       [{ role: 'chef',      msg: (t) => `🔍 Développement prêt pour révision : "${t.title}"` }],
  delivered:             [{ role: 'client',    msg: (t) => `📦 Votre projet a été livré : "${t.title}"` }],
  completed:             [{ role: 'chef',      msg: (t) => `🎉 Projet terminé : "${t.title}"` },
                          { role: 'client',    msg: (t) => `🎉 Votre projet est terminé : "${t.title}"` }],
};

async function pushNotification(status, task) {
  const targets = STATUS_NOTIFICATIONS[status];
  if (!targets) return;
  await Promise.all(targets.map(cfg =>
    Notification.create({
      message:   cfg.msg(task),
      role:      cfg.role,
      taskId:    task._id,
      taskTitle: task.title,
    })
  ));
}

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
    const { title, description, priority, deadline } = req.body;

    const task = new Task({
      title,
      description,
      priority,
      deadline: deadline || undefined,
      status: 'pending_chef',
      clientEmail: req.user.email,
      log: [{ time: new Date().toLocaleString('fr-FR'), msg: `Projet soumis par ${req.user.name}` }]
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
    // fire-and-forget : n'affecte pas la réponse en cas d'erreur
    pushNotification('pending_chef', savedTask).catch(console.error);
    Notification.create({
      message:   `✅ Votre projet "${savedTask.title}" a été soumis avec succès`,
      role:      'client',
      taskId:    savedTask._id,
      taskTitle: savedTask.title,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { status, logMsg, designerNote, devNote, chefNote } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Projet introuvable' });

    const prevStatus = task.status;
    if (status) task.status = status;
    if (designerNote !== undefined) task.designerNote = designerNote;
    if (devNote      !== undefined) task.devNote      = devNote;
    if (chefNote     !== undefined) task.chefNote     = chefNote;

    if (logMsg) {
      task.log.push({ time: new Date().toLocaleString('fr-FR'), msg: logMsg });
    }

    const { notifyChef } = req.body;

    const updatedTask = await task.save();
    res.json(updatedTask);

    if (status && status !== prevStatus) {
      pushNotification(status, updatedTask).catch(console.error);
    }

    if (notifyChef && logMsg) {
      Notification.create({
        message:   `💬 Message client sur "${updatedTask.title}" : ${logMsg.replace('💬 Message du client : ', '')}`,
        role:      'chef',
        taskId:    updatedTask._id,
        taskTitle: updatedTask.title,
      }).catch(console.error);
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Projet introuvable' });
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Projet introuvable' });

    const role = req.params.role;
    const newFiles = req.files.map(f => ({
      name: f.originalname,
      url: `/uploads/${req.params.id}/${role}/${f.filename}`,
      uploadedAt: new Date().toLocaleString('fr-FR'),
    }));

    if (role === 'designer') task.designerFiles.push(...newFiles);
    else if (role === 'chef')     task.chefFiles.push(...newFiles);
    else if (role === 'dev')      task.devFiles.push(...newFiles);

    await task.save();
    res.json({ files: newFiles });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
