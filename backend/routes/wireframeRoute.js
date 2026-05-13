const express = require('express');
const router = express.Router();
const Wireframe = require('../models/Wireframe');
const auth = require('../middleware/auth');

// Créer un nouveau wireframe
router.post('/', auth, async (req, res) => {
  try {
    const { name, elements, imageUrl, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du wireframe est requis'
      });
    }

    const wireframe = new Wireframe({
      name,
      elements: elements || [],
      imageUrl: imageUrl || null,
      description: description || '',
      status: 'completed',
      createdBy: req.user.id
    });

    await wireframe.save();
    
    res.status(201).json({
      success: true,
      wireframe
    });
  } catch (error) {
    console.error('Erreur lors de la création du wireframe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du wireframe'
    });
  }
});

// Récupérer tous les wireframes de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const wireframes = await Wireframe.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      wireframes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des wireframes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des wireframes'
    });
  }
});

// Récupérer un wireframe spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const wireframe = await Wireframe.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!wireframe) {
      return res.status(404).json({
        success: false,
        message: 'Wireframe non trouvé'
      });
    }

    res.json({
      success: true,
      wireframe
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du wireframe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du wireframe'
    });
  }
});

// Mettre à jour un wireframe
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, elements } = req.body;
    
    const wireframe = await Wireframe.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { 
        name: name || undefined,
        elements: elements || undefined,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!wireframe) {
      return res.status(404).json({
        success: false,
        message: 'Wireframe non trouvé'
      });
    }

    res.json({
      success: true,
      wireframe
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du wireframe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du wireframe'
    });
  }
});

// Supprimer un wireframe
router.delete('/:id', auth, async (req, res) => {
  try {
    const wireframe = await Wireframe.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!wireframe) {
      return res.status(404).json({
        success: false,
        message: 'Wireframe non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Wireframe supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du wireframe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du wireframe'
    });
  }
});

// Dupliquer un wireframe
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalWireframe = await Wireframe.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!originalWireframe) {
      return res.status(404).json({
        success: false,
        message: 'Wireframe non trouvé'
      });
    }

    const duplicatedWireframe = new Wireframe({
      name: `${originalWireframe.name} (copie)`,
      elements: originalWireframe.elements,
      createdBy: req.user.id
    });

    await duplicatedWireframe.save();

    res.status(201).json({
      success: true,
      wireframe: duplicatedWireframe
    });
  } catch (error) {
    console.error('Erreur lors de la duplication du wireframe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la duplication du wireframe'
    });
  }
});

module.exports = router;
