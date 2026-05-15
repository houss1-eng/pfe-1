const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir les images générées (PNG, SVG)
app.use('/generated', express.static(path.join(__dirname, 'generated'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Middleware de log pour débugger les 404
app.use((req, res, next) => {
  console.log(`[5000] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth',      require('./routes/authRoute'));
app.use('/api/tasks',     require('./routes/taskRoute'));
app.use('/api/notifications', require('./routes/notificationRoute'));
app.use('/api/wireframes',require('./routes/wireframeRoute'));
app.use('/api/n8n',       require('./routes/n8nRoute'));
app.use('/api/automation',require('./routes/n8nRoute'));
app.use('/api/contracts', require('./routes/contractRoute'));

// Serve uploaded contract PDFs (unsigned + signed)
app.use('/uploads/contracts', express.static(path.join(__dirname, 'uploads/contracts')));

// Route de test sans authentification
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working without auth' });
});

// Endpoint appelé par n8n pour générer les éléments wireframe
app.post('/api/generate', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt requis' });

  const { generateElementsFromPrompt, generateSVGFromElements } = require('./utils/wireframeUtils');
  const elements = generateElementsFromPrompt(prompt);
  const svgContent = generateSVGFromElements(elements, prompt);
  const filename = `gen_${Date.now()}.svg`;
  const filePath = path.join(generatedDir, filename);
  fs.writeFileSync(filePath, svgContent);

  res.json({
    status: 'completed',
    elements,
    image_path: `/generated/${filename}`,
    prompt,
    generatedAt: new Date().toISOString()
  });
});

// Mock API pour simuler le service IA utilisé par n8n
app.post('/api/mock/generate', (req, res) => {
  const { prompt } = req.body;

  // Générer des éléments basiques basés sur le prompt
  const elements = [
    {
      id: 'el-1',
      type: 'nav',
      text: 'Navigation',
      x: 0,
      y: 0,
      width: 800,
      height: 60,
      color: '#4F46E5'
    },
    {
      id: 'el-2',
      type: 'text',
      text: prompt || 'Contenu généré',
      x: 20,
      y: 80,
      width: 300,
      height: 40,
      color: '#ffffff'
    },
    {
      id: 'el-3',
      type: 'button',
      text: 'Action',
      x: 20,
      y: 140,
      width: 120,
      height: 40,
      color: '#10B981'
    }
  ];

  res.json({
    status: 'completed',
    elements: elements,
    prompt: prompt,
    generatedAt: new Date().toISOString()
  });
});

// Dossier pour les images générées
const generatedDir = path.join(__dirname, 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proflow';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connecté');
    await seedUsers();
    app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
  })
  .catch(err => console.error('Erreur MongoDB:', err));

async function seedUsers() {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    const defaultUsers = [
      { email: 'client@proflow.com', name: 'Client', role: 'client', password: 'client123' },
      { email: 'chef@proflow.com', name: 'Chef de Projet', role: 'chef', password: 'chef123' },
      { email: 'designer@proflow.com', name: 'Designer', role: 'designer', password: 'designer123' },
      { email: 'dev@proflow.com', name: 'Développeur', role: 'developer', password: 'dev123' }
    ];

    for (let u of defaultUsers) {
      const salt = await bcrypt.genSalt(10);
      u.password = await bcrypt.hash(u.password, salt);
      await User.create(u);
    }
    console.log('Utilisateurs de test insérés');
  }
}

const { generateSVGFromElements, generateElementsFromPrompt } = require('./utils/wireframeUtils');

