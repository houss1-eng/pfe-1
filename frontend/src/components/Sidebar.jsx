import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const NAV_ITEMS = {
  client: [
    { id: 'client-stats',    icon: '📊', label: 'Tableau de bord' },
    { id: 'client-form',     icon: '✦',  label: 'Nouveau projet'  },
    { id: 'client-projects', icon: '📁', label: 'Mes projets'     },
  ],
  chef: [
    { id: 'chef-stats',  icon: '📊', label: 'Tableau de bord'   },
    { id: 'chef-team',   icon: '👥', label: 'Équipe'            },
    { id: 'chef-action', icon: '⚡', label: 'Actions requises'  },
    { id: 'chef-all',    icon: '📁', label: 'Tous les projets'  },
  ],
  designer: [
    { id: 'designer-stats',    icon: '📊', label: 'Tableau de bord'  },
    { id: 'designer-tools',    icon: '🎨', label: 'Outils Design'    },
    { id: 'designer-projects', icon: '📋', label: 'Projets assignés' },
  ],
  developer: [
    { id: 'dev-stats',    icon: '📊', label: 'Tableau de bord'  },
    { id: 'dev-projects', icon: '💻', label: 'Projets assignés' },
  ],
};

const ROLE_CONFIG = {
  client:    { label: 'Client',         color: '#f59e0b' },
  chef:      { label: 'Chef de Projet', color: '#6366f1' },
  designer:  { label: 'Designer',       color: '#ec4899' },
  developer: { label: 'Développeur',    color: '#10b981' },
};

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const [active, setActive] = useState(null);

  const cfg   = ROLE_CONFIG[user?.role] || ROLE_CONFIG.client;
  const items = NAV_ITEMS[user?.role]   || [];
  const color = cfg.color;

  const handleNav = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        Pro<span style={{ color }}>Flow</span>
      </div>

      {/* Badge rôle */}
      <div className="sidebar-role-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
        {cfg.label}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {items.map(item => (
          <button
            key={item.id}
            className={`sidebar-item${active === item.id ? ' sidebar-item--active' : ''}`}
            style={active === item.id ? {
              color,
              background: `${color}12`,
              borderLeftColor: color,
            } : {}}
            onClick={() => handleNav(item.id)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Utilisateur + déconnexion */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: `${color}20`, color }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          <span>⏻</span> Déconnexion
        </button>
      </div>
    </aside>
  );
}
