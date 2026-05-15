const Contract = require('../models/Contract');
const axios    = require('axios');
const path     = require('path');
const fs       = require('fs');

const N8N_BASE = process.env.N8N_BASE_URL || 'http://localhost:5678';
const API_BASE = process.env.API_BASE_URL  || 'http://localhost:5000';

// ── Chef: send unsigned contract to client ────────────────────────────────────
exports.sendToClient = async (req, res) => {
  try {
    const { ref, title, clientEmail, clientName } = req.body;
    const file = req.file;

    if (!file || !ref || !title || !clientEmail || !clientName) {
      return res.status(400).json({ message: 'Données manquantes (ref, title, clientEmail, clientName, pdf)' });
    }

    const contract = await Contract.create({
      ref,
      title,
      chefId:      req.user.id,
      chefEmail:   req.user.email,
      chefName:    req.user.name,
      clientEmail,
      clientName,
      pdfFilename: file.filename,
      status:      'sent',
      sentAt:      new Date(),
    });

    const downloadUrl = `${API_BASE}/uploads/contracts/${file.filename}`;

    // Fire-and-forget n8n trigger
    axios.post(`${N8N_BASE}/webhook/contract-to-client`, {
      contractId: contract._id,
      ref,
      title,
      clientEmail,
      clientName,
      chefName:    req.user.name,
      downloadUrl,
    }).catch(err => console.error('[n8n] contract-to-client:', err.message));

    res.status(201).json({ message: 'Contrat envoyé avec succès', contract });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Get contracts (chef: all theirs | client: by email) ───────────────────────
exports.getContracts = async (req, res) => {
  try {
    const filter = req.user.role === 'chef'
      ? { chefId: req.user.id }
      : { clientEmail: req.user.email };

    const contracts = await Contract.find(filter).sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── Client: upload signed PDF ─────────────────────────────────────────────────
exports.uploadSigned = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contrat introuvable' });

    const isOwner = contract.clientEmail === req.user.email || req.user.role === 'chef';
    if (!isOwner) return res.status(403).json({ message: 'Accès refusé' });

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Fichier PDF manquant' });

    // Remove old signed file if it exists
    if (contract.signedFilename) {
      const old = path.join(__dirname, '../uploads/contracts', contract.signedFilename);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    contract.signedFilename = file.filename;
    contract.signedAt = new Date();
    await contract.save();

    res.json({ message: 'Version signée uploadée', contract });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Client: send signed contract back to chef ─────────────────────────────────
exports.returnToChef = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contrat introuvable' });
    if (contract.clientEmail !== req.user.email)
      return res.status(403).json({ message: 'Accès refusé' });
    if (!contract.signedFilename)
      return res.status(400).json({ message: "Veuillez d'abord uploader le contrat signé" });

    contract.status     = 'signed';
    contract.returnedAt = new Date();
    await contract.save();

    const signedUrl = `${API_BASE}/uploads/contracts/${contract.signedFilename}`;

    axios.post(`${N8N_BASE}/webhook/signed-contract-returned`, {
      contractId:       contract._id,
      ref:              contract.ref,
      title:            contract.title,
      chefEmail:        contract.chefEmail,
      chefName:         contract.chefName,
      clientName:       contract.clientName,
      clientEmail:      contract.clientEmail,
      signedDownloadUrl: signedUrl,
    }).catch(err => console.error('[n8n] signed-contract-returned:', err.message));

    res.json({ message: 'Contrat signé envoyé au chef de projet', contract });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Chef: mark contract as completed ──────────────────────────────────────────
exports.markCompleted = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contrat introuvable' });
    if (req.user.role !== 'chef') return res.status(403).json({ message: 'Accès refusé' });

    contract.status = 'completed';
    await contract.save();
    res.json({ message: 'Contrat complété', contract });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
