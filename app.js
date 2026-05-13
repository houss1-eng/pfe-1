// ProFlow - Gestion de Projets Collaboratifs
let currentUser = null;
let currentPage = 'dashboard';

// ═══════════════════════════════════════
//     FONCTIONS D'AUTHENTIFICATION
//═══════════════════════════════════════

function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    
    // Validation basique
    if (!email || !password) {
        errorEl.style.display = 'block';
        return;
    }
    
    // Simulation d'authentification (à remplacer par appel backend)
    const users = {
        'client@proflow.com': { role: 'client', name: 'Client Démo', password: 'client123' },
        'chef@proflow.com': { role: 'chef', name: 'Chef de Projet', password: 'chef123' },
        'designer@proflow.com': { role: 'designer', name: 'Designer', password: 'designer123' },
        'dev@proflow.com': { role: 'dev', name: 'Développeur', password: 'dev123' }
    };
    
    if (users[email] && users[email].password === password) {
        currentUser = { email, ...users[email] };
        errorEl.style.display = 'none';
        showApp();
    } else {
        errorEl.style.display = 'block';
    }
}

function doLogout() {
    currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-pass').value = '';
}

function fillDemo(email, password) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value = password;
}

// ═══════════════════════════════════════
//     FONCTIONS DE NAVIGATION
//═══════════════════════════════════════

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    // Mettre à jour les infos utilisateur
    document.getElementById('nav-user-email').textContent = currentUser.email;
    document.getElementById('nav-role-badge').textContent = getRoleLabel(currentUser.role);
    document.getElementById('nav-role-badge').style.background = getRoleColor(currentUser.role);
    
    // Afficher la page par défaut selon le rôle
    if (currentUser.role === 'designer') {
        showDesignerSpace();
    } else {
        showDashboard();
    }
}

function getRoleLabel(role) {
    const labels = {
        'client': 'Client',
        'chef': 'Chef de Projet',
        'designer': 'Designer',
        'dev': 'Développeur'
    };
    return labels[role] || role;
}

function getRoleColor(role) {
    const colors = {
        'client': 'var(--accent-client)',
        'chef': 'var(--accent-chef)',
        'designer': 'var(--accent-designer)',
        'dev': 'var(--accent-dev)'
    };
    return colors[role] || '#666';
}

// ═══════════════════════════════════════
//     PAGES DE L'APPLICATION
//═══════════════════════════════════════

function showDashboard() {
    currentPage = 'dashboard';
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>Tableau de Bord</h1>
            <p>Bienvenue, ${currentUser.name}!</p>
        </div>
        
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-number">12</div>
                <div class="stat-label">Projets Actifs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">28</div>
                <div class="stat-label">Tâches en Cours</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">5</div>
                <div class="stat-label">Équipes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">89%</div>
                <div class="stat-label">Productivité</div>
            </div>
        </div>
        
        <div class="recent-projects">
            <h2>Projets Récents</h2>
            <div class="project-list">
                <div class="project-card">
                    <h3>Site E-commerce</h3>
                    <p>Design et développement d'une plateforme de vente en ligne</p>
                    <div class="project-progress">
                        <div class="progress-bar" style="width: 75%"></div>
                        <span>75%</span>
                    </div>
                </div>
                <div class="project-card">
                    <h3>Application Mobile</h3>
                    <p>Application iOS/Android pour la gestion de tâches</p>
                    <div class="project-progress">
                        <div class="progress-bar" style="width: 45%"></div>
                        <span>45%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showDesignerSpace() {
    currentPage = 'designer';
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>Espace Designer</h1>
            <p>Créez et gérez vos designs et wireframes</p>
        </div>
        
        <div class="designer-tools">
            <div class="tool-card" onclick="showWireframeGenerator()">
                <div class="tool-icon">🎨</div>
                <h3>Générateur de Wireframe</h3>
                <p>Créez des maquettes interactives pour vos projets</p>
                <button class="btn-primary">Lancer</button>
            </div>
            
            <div class="tool-card">
                <div class="tool-icon">🖼️</div>
                <h3>Galerie de Designs</h3>
                <p>Consultez et gérez vos créations</p>
                <button class="btn-secondary">Voir</button>
            </div>
            
            <div class="tool-card">
                <div class="tool-icon">📐</div>
                <h3>Templates</h3>
                <p>Utilisez des modèles prédéfinis</p>
                <button class="btn-secondary">Explorer</button>
            </div>
        </div>
        
        <div class="recent-designs">
            <h2>Designs Récents</h2>
            <div class="design-grid">
                <div class="design-item">
                    <div class="design-preview" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);"></div>
                    <h4>Dashboard Admin</h4>
                    <p>Modifié il y a 2 heures</p>
                </div>
                <div class="design-item">
                    <div class="design-preview" style="background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);"></div>
                    <h4>Page Produit</h4>
                    <p>Modifié hier</p>
                </div>
            </div>
        </div>
    `;
}

function showWireframeGenerator() {
    currentPage = 'wireframe';
    const mainContent = document.getElementById('main-content');
    
    // Charger le générateur de wireframe dans un iframe
    mainContent.innerHTML = `
        <div class="page-header">
            <button class="btn-back" onclick="showDesignerSpace()">← Retour à l'espace Designer</button>
            <h1>Générateur de Wireframe</h1>
        </div>
        
        <iframe src="wireframe-generator/index.html" 
                style="width: 100%; height: 80vh; border: none; border-radius: 8px; background: white;"
                onload="this.style.opacity='1'" 
                onerror="this.innerHTML='<div style=\\'padding: 50px; text-align: center;\\'><h3>Erreur de chargement</h3><p>Le générateur de wireframe n\\'est pas disponible</p></div>'">
        </iframe>
    `;
}

// ═══════════════════════════════════════
//     MODAL ET NOTIFICATIONS
//═══════════════════════════════════════

function showModal(title, content, confirmCallback) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Stocker le callback pour le bouton confirmer
    window.modalConfirmCallback = confirmCallback;
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    window.modalConfirmCallback = null;
}

function modalConfirm() {
    if (window.modalConfirmCallback) {
        window.modalConfirmCallback();
    }
    closeModal();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    
    toastMsg.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : '⚠';
    toast.style.background = type === 'success' ? '#4CAF50' : '#f44336';
    
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ═══════════════════════════════════════
//     INITIALISATION
//═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    // Masquer l'application au chargement
    document.getElementById('app').style.display = 'none';
    
    // Gérer la touche Entrée pour la connexion
    document.getElementById('login-pass').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            doLogin();
        }
    });
    
    // Gérer la fermeture du modal avec la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Cliquer sur l'overlay pour fermer le modal
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});
