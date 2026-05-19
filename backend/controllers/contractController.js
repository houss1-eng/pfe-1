const Contract      = require('../models/Contract');
const SavedContract = require('../models/SavedContract');
const axios         = require('axios');
const path          = require('path');
const fs            = require('fs');

const N8N_CONTRACT_WEBHOOK = process.env.N8N_CONTRACT_WEBHOOK_URL || 'http://localhost:5678/webhook/proflow-send-contract';
const N8N_RETURN_WEBHOOK   = process.env.N8N_RETURN_WEBHOOK_URL   || 'http://localhost:5678/webhook/proflow-return-signed';
const API_BASE             = process.env.API_BASE_URL              || 'http://localhost:5000';
const PORTAL_BASE_URL      = process.env.PORTAL_BASE_URL           || 'http://localhost:3000/portal';

// ── Chef: send unsigned contract to client ────────────────────────────────────
exports.sendToClient = async (req, res) => {
  try {
    const {
      ref, title, clientEmail, clientName,
      projectTitle, prestataireEmail, prestataireCompany, prestataireTel,
      montantTtc, devise, dateSignature,
    } = req.body;
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

    const pdfUrl   = `${API_BASE}/uploads/contracts/${file.filename}`;
    const filename = `Contrat_${ref}.pdf`;

    // Fire-and-forget: trigger n8n "ProFlow — 1. Chef envoie contrat au client"
    axios.post(N8N_CONTRACT_WEBHOOK, {
      pdf_url:             pdfUrl,
      filename,
      contract_ref:        ref,
      client_name:         clientName,
      project_title:       projectTitle || title,
      chef_projet:         req.user.name,
      prestataire_email:   prestataireEmail   || req.user.email,
      prestataire_company: prestataireCompany || '',
      prestataire_tel:     prestataireTel     || '',
      montant_ttc:         montantTtc         || '',
      devise:              devise             || 'TND',
      date_signature:      dateSignature      || '',
      client_email:        clientEmail,
      portal_base_url:     PORTAL_BASE_URL,
      return_webhook_url:  N8N_RETURN_WEBHOOK,
    }).catch(err => console.error('[n8n] proflow-send-contract:', err.message));

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

    axios.post(N8N_RETURN_WEBHOOK, {
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

// ── Chef: save contract draft ─────────────────────────────────────────────────
exports.saveContract = async (req, res) => {
  try {
    const { ref, clientEmail, formData } = req.body;
    if (!ref || !clientEmail || !formData)
      return res.status(400).json({ message: 'Données manquantes (ref, clientEmail, formData)' });

    const saved = await SavedContract.findOneAndUpdate(
      { chefId: req.user.id, ref },
      { chefEmail: req.user.email, clientEmail, ref, formData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Contrat sauvegardé', saved });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ── Chef: get saved contracts ─────────────────────────────────────────────────
exports.getSavedContracts = async (req, res) => {
  try {
    const saved = await SavedContract.find({ chefId: req.user.id }).sort({ updatedAt: -1 });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
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
