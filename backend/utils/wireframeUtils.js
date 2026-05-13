function generateSVGFromElements(elements, label) {
  const width = 850;
  const height = 600;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #1a1a2e;">`;
  svgContent += `<text x="20" y="30" fill="#ffffff" font-size="20" font-weight="bold">${label || 'Wireframe'}</text>`;

  elements.forEach(el => {
    if (el.type === 'nav') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color}" rx="8"/>`;
      svgContent += `<text x="${el.x + 20}" y="${el.y + 35}" fill="white" font-size="16">${el.text}</text>`;
    } else if (el.type === 'text') {
      svgContent += `<text x="${el.x}" y="${el.y + 25}" fill="${el.color}" font-size="14">${el.text}</text>`;
    } else if (el.type === 'button') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color}" rx="8"/>`;
      svgContent += `<text x="${el.x + el.width / 2}" y="${el.y + 27}" fill="white" font-size="14" text-anchor="middle">${el.text}</text>`;
    } else if (el.type === 'input') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color}" stroke="#cccccc" stroke-width="1" rx="4"/>`;
      svgContent += `<text x="${el.x + 10}" y="${el.y + 27}" fill="#666666" font-size="14">${el.text}</text>`;
    } else if (el.type === 'container') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color}" rx="8"/>`;
      svgContent += `<text x="${el.x + 20}" y="${el.y + 30}" fill="white" font-size="14">${el.text}</text>`;
    } else if (el.type === 'image') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color}" rx="8"/>`;
      svgContent += `<text x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" fill="#ffffff" font-size="12" text-anchor="middle">[ ${el.text} ]</text>`;
    }
  });

  svgContent += '</svg>';
  return svgContent;
}

function generateElementsFromPrompt(promptText) {
  const lowerPrompt = (promptText || '').toLowerCase();
  const elements = [];
  let yPos = 0;

  // Navigation commune
  elements.push({
    id: 'el-nav',
    type: 'nav',
    text: 'Logo | Accueil | À propos | Contact',
    x: 0, y: yPos, width: 800, height: 60, color: '#4F46E5'
  });
  yPos += 80;

  // --- Register / Inscription ---
  if (lowerPrompt.includes('register') || lowerPrompt.includes('inscription') || lowerPrompt.includes('signup') || lowerPrompt.includes('s\'inscrire')) {
    elements.push(
      { id: 'el-title', type: 'text', text: 'Créer un compte', x: 220, y: yPos, width: 360, height: 40, color: '#ffffff' },
      { id: 'el-name-label', type: 'text', text: 'Nom complet', x: 220, y: yPos + 50, width: 200, height: 20, color: '#cccccc' },
      { id: 'el-name', type: 'input', text: 'Votre nom', x: 220, y: yPos + 75, width: 360, height: 40, color: '#ffffff' },
      { id: 'el-email-label', type: 'text', text: 'Email', x: 220, y: yPos + 130, width: 200, height: 20, color: '#cccccc' },
      { id: 'el-email', type: 'input', text: 'votre@email.com', x: 220, y: yPos + 155, width: 360, height: 40, color: '#ffffff' },
      { id: 'el-pass-label', type: 'text', text: 'Mot de passe', x: 220, y: yPos + 210, width: 200, height: 20, color: '#cccccc' },
      { id: 'el-pass', type: 'input', text: '••••••••', x: 220, y: yPos + 235, width: 360, height: 40, color: '#ffffff' },
      { id: 'el-confirm-label', type: 'text', text: 'Confirmer le mot de passe', x: 220, y: yPos + 290, width: 250, height: 20, color: '#cccccc' },
      { id: 'el-confirm', type: 'input', text: '••••••••', x: 220, y: yPos + 315, width: 360, height: 40, color: '#ffffff' },
      { id: 'el-submit', type: 'button', text: "S'inscrire", x: 220, y: yPos + 380, width: 360, height: 45, color: '#10B981' },
      { id: 'el-login-link', type: 'text', text: 'Déjà un compte ? Se connecter', x: 280, y: yPos + 440, width: 240, height: 20, color: '#818cf8' }
    );

  // --- Login / Connexion ---
  } else if (lowerPrompt.includes('login') || lowerPrompt.includes('connexion') || lowerPrompt.includes('signin') || lowerPrompt.includes('se connecter')) {
    elements.push(
      { id: 'el-title', type: 'text', text: 'Connexion', x: 250, y: yPos, width: 300, height: 40, color: '#ffffff' },
      { id: 'el-email-label', type: 'text', text: 'Email', x: 250, y: yPos + 55, width: 100, height: 20, color: '#cccccc' },
      { id: 'el-email', type: 'input', text: 'votre@email.com', x: 250, y: yPos + 80, width: 300, height: 40, color: '#ffffff' },
      { id: 'el-pass-label', type: 'text', text: 'Mot de passe', x: 250, y: yPos + 135, width: 150, height: 20, color: '#cccccc' },
      { id: 'el-pass', type: 'input', text: '••••••••', x: 250, y: yPos + 160, width: 300, height: 40, color: '#ffffff' },
      { id: 'el-submit', type: 'button', text: 'Se connecter', x: 250, y: yPos + 230, width: 300, height: 45, color: '#10B981' },
      { id: 'el-register-link', type: 'text', text: 'Pas de compte ? S\'inscrire', x: 270, y: yPos + 295, width: 260, height: 20, color: '#818cf8' }
    );

  // --- Dashboard ---
  } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('tableau de bord') || lowerPrompt.includes('admin')) {
    elements.push(
      { id: 'el-sidebar', type: 'container', text: 'Sidebar', x: 0, y: yPos, width: 200, height: 480, color: '#1e293b' },
      { id: 'el-menu1', type: 'button', text: 'Accueil', x: 10, y: yPos + 20, width: 180, height: 36, color: '#4F46E5' },
      { id: 'el-menu2', type: 'button', text: 'Utilisateurs', x: 10, y: yPos + 65, width: 180, height: 36, color: '#334155' },
      { id: 'el-menu3', type: 'button', text: 'Statistiques', x: 10, y: yPos + 110, width: 180, height: 36, color: '#334155' },
      { id: 'el-menu4', type: 'button', text: 'Paramètres', x: 10, y: yPos + 155, width: 180, height: 36, color: '#334155' },
      { id: 'el-stat1', type: 'container', text: 'Utilisateurs: 1,240', x: 210, y: yPos, width: 180, height: 80, color: '#4F46E5' },
      { id: 'el-stat2', type: 'container', text: 'Ventes: 340', x: 400, y: yPos, width: 180, height: 80, color: '#10B981' },
      { id: 'el-stat3', type: 'container', text: 'Revenus: 12k€', x: 590, y: yPos, width: 180, height: 80, color: '#F59E0B' },
      { id: 'el-chart', type: 'container', text: '[ Graphique ]', x: 210, y: yPos + 100, width: 380, height: 200, color: '#1e293b' },
      { id: 'el-table', type: 'container', text: '[ Tableau de données ]', x: 210, y: yPos + 315, width: 560, height: 140, color: '#0f172a' }
    );

  // --- Landing Page ---
  } else if (lowerPrompt.includes('landing') || lowerPrompt.includes('accueil') || lowerPrompt.includes('home') || lowerPrompt.includes('hero')) {
    elements.push(
      { id: 'el-hero', type: 'container', text: 'Hero Section', x: 0, y: yPos, width: 800, height: 180, color: '#312e81' },
      { id: 'el-title', type: 'text', text: 'Bienvenue sur notre plateforme', x: 150, y: yPos + 50, width: 500, height: 40, color: '#ffffff' },
      { id: 'el-cta', type: 'button', text: 'Commencer gratuitement', x: 280, y: yPos + 110, width: 240, height: 45, color: '#10B981' },
      { id: 'el-feat1', type: 'container', text: '✔ Feature 1', x: 20, y: yPos + 210, width: 230, height: 100, color: '#1e293b' },
      { id: 'el-feat2', type: 'container', text: '✔ Feature 2', x: 280, y: yPos + 210, width: 230, height: 100, color: '#1e293b' },
      { id: 'el-feat3', type: 'container', text: '✔ Feature 3', x: 540, y: yPos + 210, width: 230, height: 100, color: '#1e293b' },
      { id: 'el-footer', type: 'nav', text: '© 2025 — Mentions légales | Contact', x: 0, y: yPos + 360, width: 800, height: 50, color: '#0f172a' }
    );

  // --- E-commerce ---
  } else if (lowerPrompt.includes('ecommerce') || lowerPrompt.includes('boutique') || lowerPrompt.includes('shop') || lowerPrompt.includes('produit')) {
    elements.push(
      { id: 'el-search', type: 'input', text: 'Rechercher un produit...', x: 200, y: yPos, width: 400, height: 40, color: '#ffffff' },
      { id: 'el-filter', type: 'button', text: 'Filtrer', x: 615, y: yPos, width: 100, height: 40, color: '#4F46E5' },
      { id: 'el-prod1', type: 'container', text: 'Produit 1\n45€', x: 20, y: yPos + 60, width: 180, height: 180, color: '#1e293b' },
      { id: 'el-prod2', type: 'container', text: 'Produit 2\n89€', x: 215, y: yPos + 60, width: 180, height: 180, color: '#1e293b' },
      { id: 'el-prod3', type: 'container', text: 'Produit 3\n25€', x: 410, y: yPos + 60, width: 180, height: 180, color: '#1e293b' },
      { id: 'el-prod4', type: 'container', text: 'Produit 4\n120€', x: 605, y: yPos + 60, width: 180, height: 180, color: '#1e293b' },
      { id: 'el-cart', type: 'button', text: '🛒 Panier (3)', x: 620, y: yPos + 260, width: 160, height: 40, color: '#10B981' }
    );

  // --- Profil / Profile ---
  } else if (lowerPrompt.includes('profil') || lowerPrompt.includes('profile') || lowerPrompt.includes('compte') || lowerPrompt.includes('paramètre')) {
    elements.push(
      { id: 'el-avatar', type: 'image', text: 'Avatar', x: 300, y: yPos, width: 200, height: 100, color: '#334155' },
      { id: 'el-name', type: 'text', text: 'Nom Prénom', x: 320, y: yPos + 115, width: 160, height: 25, color: '#ffffff' },
      { id: 'el-email', type: 'text', text: 'email@example.com', x: 300, y: yPos + 145, width: 200, height: 20, color: '#94a3b8' },
      { id: 'el-edit-btn', type: 'button', text: 'Modifier le profil', x: 300, y: yPos + 180, width: 200, height: 40, color: '#4F46E5' },
      { id: 'el-settings', type: 'container', text: 'Paramètres du compte', x: 100, y: yPos + 245, width: 600, height: 180, color: '#1e293b' }
    );

  // --- Générique ---
  } else {
    elements.push(
      { id: 'el-title', type: 'text', text: promptText ? promptText.substring(0, 50) : 'Page', x: 20, y: yPos, width: 600, height: 40, color: '#ffffff' },
      { id: 'el-desc', type: 'text', text: 'Description de la page', x: 20, y: yPos + 55, width: 500, height: 25, color: '#94a3b8' },
      { id: 'el-content', type: 'container', text: 'Contenu principal', x: 20, y: yPos + 100, width: 560, height: 200, color: '#1e293b' },
      { id: 'el-sidebar', type: 'container', text: 'Sidebar', x: 600, y: yPos + 100, width: 180, height: 200, color: '#0f172a' },
      { id: 'el-cta', type: 'button', text: 'Action principale', x: 20, y: yPos + 320, width: 200, height: 45, color: '#10B981' }
    );
  }

  return elements;
}

module.exports = { generateSVGFromElements, generateElementsFromPrompt };
