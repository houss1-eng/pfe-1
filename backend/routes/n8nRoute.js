const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const router = express.Router();
const Wireframe = require('../models/Wireframe');
const { generateSVGFromElements, generateElementsFromPrompt } = require('../utils/wireframeUtils');
// const auth = require('../middleware/auth'); // Désactivé temporairement pour test

const generatedDir = path.join(__dirname, '../generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

// Configuration n8n
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/generate-wireframe';
const N8N_CODE_WEBHOOK_URL = process.env.N8N_CODE_WEBHOOK_URL || 'http://localhost:5678/webhook-test/generate-code';
console.log('N8N_WEBHOOK_URL configuré:', N8N_WEBHOOK_URL);

// Multer en mémoire pour le générateur de code
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Réception image PNG binaire depuis n8n (évite le base64 tronqué)
router.post('/upload-image', express.raw({ type: '*/*', limit: '20mb' }), async (req, res) => {
  try {
    const { wireframeId, filename } = req.query;
    if (!wireframeId || !filename) {
      return res.status(400).json({ success: false, message: 'wireframeId et filename requis' });
    }

    const filePath = path.join(generatedDir, filename);
    fs.writeFileSync(filePath, req.body);
    console.log(`✅ Image sauvegardée: ${filename} (${req.body.length} bytes)`);

    const imageUrl = `/generated/${filename}`;
    const wireframe = await Wireframe.findByIdAndUpdate(
      wireframeId,
      { $set: { status: 'completed', imageUrl, updatedAt: Date.now() } },
      { new: true }
    );

    if (!wireframe) {
      return res.status(404).json({ success: false, message: 'Wireframe non trouvé' });
    }

    res.json({ success: true, imageUrl, wireframeId });
  } catch (error) {
    console.error('❌ Erreur upload-image:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Générer un wireframe automatiquement
router.post('/generate', async (req, res) => {
  console.log('=== Début génération wireframe ===');
  console.log('Body reçu:', req.body);
  
  try {
    const { prompt, projectName, description } = req.body;
    
    if (!prompt) {
      console.log('Erreur: Prompt manquant');
      return res.status(400).json({ 
        success: false, 
        message: 'Le prompt est requis pour la génération automatique' 
      });
    }

    console.log('Création wireframe avec:', { prompt, projectName, description });

    // Créer un wireframe temporaire avec statut "generating"
    const tempWireframe = new Wireframe({
      name: projectName || `Wireframe généré: ${prompt.substring(0, 50)}...`,
      elements: [],
      status: 'generating',
      description: description || `Généré automatiquement avec le prompt: ${prompt}`
    });

    console.log('Sauvegarde wireframe...');
    await tempWireframe.save();
    console.log('Wireframe sauvegardé avec ID:', tempWireframe._id);

    // Extraire le token JWT depuis le header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';

    // Appeler le webhook n8n
    console.log('Appel webhook n8n:', N8N_WEBHOOK_URL);

    try {
      const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
        prompt: prompt,
        projectName: projectName,
        description: description,
        wireframeId: tempWireframe._id.toString(),
        token: token
      });
      
      console.log('Réponse n8n reçue:', n8nResponse.status);
      
      // Retourner un succès immédiat pour indiquer que la génération a démarré
      res.json({
        success: true,
        wireframe: tempWireframe,
        message: 'Génération lancée avec succès via n8n'
      });
    } catch (apiError) {
      console.error('❌ Erreur lors de l\'appel à n8n:', apiError.message);
      if (apiError.code === 'ECONNREFUSED') {
        console.error('CONSEIL: Assurez-vous que n8n est lancé sur le port 5678');
      }

      tempWireframe.status = 'failed';
      await tempWireframe.save();

      res.status(500).json({
        success: false,
        message: 'Impossible de contacter n8n. Vérifiez que n8n est lancé sur le port 5678.',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Erreur lors de la génération du wireframe:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du wireframe',
      error: error.message
    });
  }
});

// Vérifier le statut d'une génération
router.get('/status/:wireframeId', async (req, res) => {
  console.log('=== Vérification statut wireframe ===');
  console.log('WireframeId reçu:', req.params.wireframeId);
  
  try {
    const wireframe = await Wireframe.findOne({
      _id: req.params.wireframeId
    });

    if (!wireframe) {
      console.log('Wireframe non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Wireframe non trouvé'
      });
    }

    console.log('Statut trouvé:', wireframe.status);
    console.log('Nombre d\'éléments:', wireframe.elements ? wireframe.elements.length : 0);

    res.json({
      success: true,
      status: wireframe.status || 'unknown',
      wireframe
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut'
    });
  }
});

// Lister les wireframes générés automatiquement
router.get('/automated', async (req, res) => {
  try {
    const wireframes = await Wireframe.find({ 
      status: { $in: ['generating', 'completed', 'failed'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      wireframes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des wireframes automatisés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des wireframes automatisés'
    });
  }
});

// Webhook pour recevoir les mises à jour de n8n
router.post('/webhook/update', async (req, res) => {
  try {
    console.log('\n=== WEBHOOK UPDATE REÇU ===');
    console.log('Body brut:', JSON.stringify(req.body, null, 2));

    let { wireframeId, status, elements, imageUrl, imageData, imageFilename, error } = req.body;

    // Parser elements si c'est une chaîne JSON
    if (typeof elements === 'string') {
      try {
        elements = JSON.parse(elements);
      } catch (parseErr) {
        elements = null;
      }
    }

    console.log('wireframeId:', wireframeId);
    console.log('status:', status);
    console.log('imageData reçu:', imageData ? `${imageData.length} chars base64` : 'non');

    if (!wireframeId) {
      return res.status(400).json({ success: false, message: 'wireframeId requis' });
    }

    const updateData = {
      status: status || 'completed',
      updatedAt: Date.now()
    };

    // Sauvegarder l'image base64 envoyée par n8n
    if (imageData && imageFilename) {
      try {
        const buffer = Buffer.from(imageData, 'base64');
        const filePath = path.join(generatedDir, imageFilename);
        fs.writeFileSync(filePath, buffer);
        updateData.imageUrl = `/generated/${imageFilename}`;
        console.log('✅ Image PNG sauvegardée:', updateData.imageUrl);
      } catch (saveErr) {
        console.error('❌ Erreur sauvegarde image:', saveErr.message);
      }
    }

    // imageUrl directe si pas d'imageData
    if (!updateData.imageUrl && imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    if (elements && Array.isArray(elements) && elements.length > 0) {
      updateData.elements = elements;
    }

    if (error) {
      updateData.error = error;
    }

    console.log('📝 updateData à sauvegarder:', JSON.stringify({ ...updateData, elements: `[${updateData.elements?.length ?? 0} éléments]` }));

    const wireframe = await Wireframe.findByIdAndUpdate(
      wireframeId,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!wireframe) {
      console.error('❌ Wireframe non trouvé pour ID:', wireframeId);
      return res.status(404).json({ success: false, message: 'Wireframe non trouvé' });
    }

    console.log('✅ Wireframe mis à jour:', {
      id: wireframe._id,
      status: wireframe.status,
      imageUrl: wireframe.imageUrl,
      elements: wireframe.elements?.length
    });

    res.json({ success: true, wireframe });
  } catch (error) {
    console.error('❌ Erreur webhook/update:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
  }
});

// Templates de prompts prédéfinis
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'dashboard',
      name: 'Dashboard Admin',
      prompt: 'Crée un dashboard administratif avec sidebar navigation, cartes de statistiques, tableau de données et filtres',
      description: 'Dashboard complet pour administration'
    },
    {
      id: 'ecommerce',
      name: 'Page E-commerce',
      prompt: 'Crée une page e-commerce avec header, barre de recherche, grille de produits, filtres et pied de page',
      description: 'Page principale de boutique en ligne'
    },
    {
      id: 'landing',
      name: 'Landing Page',
      prompt: 'Crée une landing page moderne avec hero section, features, testimonials et call-to-action',
      description: 'Page d\'atterrissage pour produit/service'
    },
    {
      id: 'mobile',
      name: 'Application Mobile',
      prompt: 'Crée une interface mobile avec bottom navigation, profil, notifications et menu',
      description: 'Interface pour application mobile'
    },
    {
      id: 'form',
      name: 'Formulaire Complex',
      prompt: 'Crée un formulaire multi-étapes avec validation, champs variés et résumé final',
      description: 'Formulaire d\'inscription ou de demande'
    }
  ];

  res.json({
    success: true,
    templates
  });
});

// Générer du code HTML/CSS — backend → n8n (image-to-json + OpenRouter intégrés)
router.post('/generate-code', upload.single('image'), async (req, res) => {
  console.log('=== /generate-code reçu ===');

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'image (fichier) requis.' });
  }

  console.log(`📤 Fichier reçu: ${req.file.originalname} (${req.file.size} bytes)`);

  const imageBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;

  try {
    console.log(`📤 Envoi vers n8n code-generator: ${N8N_CODE_WEBHOOK_URL}`);
    const n8nResponse = await axios.post(
      N8N_CODE_WEBHOOK_URL,
      { imageBase64, mimeType },
      { timeout: 120000 }
    );
    console.log('📥 Réponse n8n:', n8nResponse.status);
    const { html = '', css = '', error } = n8nResponse.data || {};
    if (error) {
      return res.status(502).json({ success: false, message: `OpenRouter: ${error}` });
    }
    if (!html && !css) {
      return res.status(502).json({ success: false, message: "n8n n'a retourné aucun code HTML/CSS.", detail: n8nResponse.data });
    }
    return res.json({ success: true, html, css });
  } catch (error) {
    console.error('❌ Erreur generate-code:', error.code, error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'n8n non disponible sur le port 5678.' });
    }
    if (error.response) {
      return res.status(502).json({ success: false, message: `n8n erreur ${error.response.status}: ${JSON.stringify(error.response.data).substring(0, 200)}` });
    }
    res.status(500).json({ success: false, message: `[${error.code || 'ERR'}] ${error.message}` });
  }
});

module.exports = router;
