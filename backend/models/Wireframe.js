const mongoose = require('mongoose');

const wireframeElementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['button', 'input', 'text', 'image', 'container', 'nav']
  },
  text: {
    type: String,
    default: ''
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    default: '#ffffff'
  }
}, { _id: false });

const wireframeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  elements: [wireframeElementSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft'
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
wireframeSchema.index({ createdBy: 1, createdAt: -1 });
wireframeSchema.index({ name: 1, createdBy: 1 });
wireframeSchema.index({ isTemplate: 1 });

// Middleware pour valider les éléments
wireframeSchema.pre('save', function() {
  // Valider que les éléments ne se chevauchent pas trop
  const elements = this.elements;
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const el1 = elements[i];
      const el2 = elements[j];
      
      // Vérifier si les éléments se chevauchent
      if (
        el1.x < el2.x + el2.width &&
        el1.x + el1.width > el2.x &&
        el1.y < el2.y + el2.height &&
        el1.y + el1.height > el2.y
      ) {
        // Permettre le chevauchement mais avertir
        console.warn(`Attention: Les éléments ${el1.id} et ${el2.id} se chevauchent`);
      }
    }
  }
});

// Méthode virtuelle pour le nombre d'éléments
wireframeSchema.virtual('elementCount').get(function() {
  return this.elements.length;
});

// Méthode pour dupliquer un wireframe
wireframeSchema.methods.duplicate = function(newName) {
  const duplicated = new this.constructor({
    name: newName || `${this.name} (copie)`,
    elements: this.elements,
    createdBy: this.createdBy,
    isTemplate: false,
    tags: [...this.tags],
    description: this.description
  });
  
  return duplicated.save();
};

// Méthode statique pour trouver les templates
wireframeSchema.statics.findTemplates = function() {
  return this.find({ isTemplate: true }).sort({ name: 1 });
};

// Méthode statique pour chercher par tags
wireframeSchema.statics.findByTags = function(tags, userId) {
  return this.find({
    createdBy: userId,
    tags: { $in: tags }
  }).sort({ createdAt: -1 });
};

// Transformer en JSON
wireframeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Wireframe', wireframeSchema);
