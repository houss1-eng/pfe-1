import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SettingsModal from './SettingsModal';

const ROUTE_MAP = {
  'chef-contracts':      '/contrat',
  'designer-wireframes': '/mes-wireframes',
  'designer-history':    '/historique-ia',
};

const NAV_ITEMS = {
  client: [
    { id: 'client-stats',    icon: '📊', label: 'Tableau de bord' },
    { id: 'client-form',     icon: '✦',  label: 'Nouveau projet'  },
    { id: 'client-projects', icon: '📁', label: 'Mes projets'     },
    { id: 'client-contracts', icon: '📄', label: 'Mes contrats'    },
  ],
  chef: [
    { id: 'chef-stats',  icon: '📊', label: 'Tableau de bord'  },
    { id: 'chef-team',   icon: '👥', label: 'Équipe'           },
    { id: 'chef-action', icon: '⚡', label: 'Actions requises' },
    { id: 'chef-all',    icon: '📁', label: 'Tous les projets' },
    { id: 'chef-clients', icon: '👤', label: 'Clients' },
    { type: 'section', label: 'Gestion' },
    { id: 'chef-contracts', icon: '📄', label: 'Contrats & Devis' },
    { id: 'chef-planning',  icon: '📅', label: 'Planning'          },
    { id: 'chef-reports',   icon: '📈', label: 'Rapports'          },
    { id: 'chef-signed',    icon: '🖋️', label: 'Contrats signés'   },
  ],
  designer: [
    { id: 'designer-stats',      icon: '📊', label: 'Tableau de bord'  },
    { id: 'designer-tools',      icon: '🎨', label: 'Outils Design'    },
    { id: 'designer-projects',   icon: '📋', label: 'Projets assignés' },
    { id: 'designer-wireframes', icon: '📁', label: 'Mes Wireframes'   },
    { id: 'designer-history',    icon: '📚', label: 'Historique IA'    },
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

export default function Sidebar({ onChefNav, chefSection, activeSection }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrollActive] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const cfg   = ROLE_CONFIG[user?.role] || ROLE_CONFIG.client;
  const items = NAV_ITEMS[user?.role]   || [];
  const color = cfg.color;

  const handleNav = (id) => {
    if (ROUTE_MAP[id]) {
      navigate(ROUTE_MAP[id]);
      return;
    }
    if (onChefNav) {
      onChefNav(id);
    } else {
      navigate('/', { state: { section: id } });
    }
  };

  const activeId = onChefNav ? chefSection : (activeSection || scrollActive);

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
        {items.map(item =>
          item.type === 'section' ? (
            <div key={item.label} className="sidebar-nav-label" style={{ marginTop: 14 }}>
              {item.label}
            </div>
          ) : (
            <button
              key={item.id}
              className={`sidebar-item${activeId === item.id ? ' sidebar-item--active' : ''}`}
              style={activeId === item.id ? {
                color,
                background: `${color}12`,
                borderLeftColor: color,
              } : {}}
              onClick={() => handleNav(item.id)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          )
        )}
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
        <button className="sidebar-logout" style={{ marginBottom: 8 }}
          onClick={() => setShowSettings(true)}>
          <span>⚙️</span> Paramètres
        </button>
        <button className="sidebar-logout" onClick={logout}>
          <span>⏻</span> Déconnexion
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
