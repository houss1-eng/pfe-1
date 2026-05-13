import { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';

export default function ClientView() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [prio, setPrio] = useState('medium');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const stats = {
    total:  tasks.length,
    active: tasks.filter(t => !['completed','rejected_client'].includes(t.status)).length,
    review: tasks.filter(t => ['review_client','delivered'].includes(t.status)).length,
    done:   tasks.filter(t => t.status === 'completed').length,
  };

  const submitTask = async () => {
    if (!title || !desc) return alert('Veuillez remplir tous les champs');
    try {
      await axios.post('http://localhost:5000/api/tasks', { title, description: desc, priority: prio });
      setTitle(''); setDesc(''); fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status, logMsg) => {
    if (!window.confirm("Confirmer cette action ?")) return;
    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}`, { status, logMsg });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Mon Espace <span className="color-client">Client</span></div>
        <div className="page-subtitle">Soumettez vos projets et suivez leur avancement en temps réel</div>
      </div>

      <div id="client-stats" className="stats-row">
        <div className="stat-card"><div className="stat-value color-client">{stats.total}</div><div className="stat-label">Total projets</div></div>
        <div className="stat-card"><div className="stat-value color-chef">{stats.active}</div><div className="stat-label">En cours</div></div>
        <div className="stat-card"><div className="stat-value" style={{color:'#f472b6'}}>{stats.review}</div><div className="stat-label">À réviser</div></div>
        <div className="stat-card"><div className="stat-value color-dev">{stats.done}</div><div className="stat-label">Terminés</div></div>
      </div>

      <div id="client-form" className="new-task-card">
        <div className="section-title">✦ Nouvelle demande de projet</div>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Titre du projet</label>
            <input className="field-input" placeholder="Ex: Site e-commerce..." value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="field-label">Priorité</label>
            <select className="field-select" value={prio} onChange={e=>setPrio(e.target.value)}>
              <option value="low">🟢 Faible</option>
              <option value="medium">🟡 Moyen</option>
              <option value="high">🔴 Urgent</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="field-label">Description détaillée</label>
          <textarea className="field-textarea" placeholder="Décrivez votre projet..." value={desc} onChange={e=>setDesc(e.target.value)}></textarea>
        </div>
        <button className="form-submit" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#000'}} onClick={submitTask}>
          ➤ Soumettre au Chef de Projet
        </button>
      </div>

      <div id="client-projects" className="section-title">Mes projets</div>
      <div className="tasks-grid">
        {!tasks.length && <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-text">Aucun projet.</div></div>}
        {tasks.map(t => {
          const reviewable = t.status === 'review_client' || t.status === 'delivered';
          return (
            <TaskCard key={t._id} t={t} fetchTasks={fetchTasks} borderClass="client" showPipeline>
              {reviewable && (
                <div className="task-actions">
                  <button className="btn-action btn-approve" onClick={() => updateStatus(t._id, t.status === 'review_client' ? 'approved_client' : 'completed', 'Client a approuvé')}>✓ Approuver</button>
                  <button className="btn-action btn-reject" onClick={() => updateStatus(t._id, 'rejected_client', 'Client a demandé une révision')}>✗ Demander révision</button>
                </div>
              )}
            </TaskCard>
          );
        })}
      </div>
    </div>
  );
}
