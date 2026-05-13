# Intégration n8n - Génération Automatisée de Wireframes

## Overview

Ce dossier contient les workflows n8n pour l'automatisation de la génération de wireframes dans ProFlow.

## Structure des Fichiers

```
n8n/
├── workflows/
│   └── wireframe-workflow.json    # Workflow principal de génération
└── README.md                      # Ce fichier
```

## Workflow de Génération de Wireframes

### Description du Workflow

Le workflow `wireframe-workflow.json` automatise la génération de wireframes via une API IA externe. Il se compose de 5 nœuds :

1. **Webhook Trigger** : Reçoit les demandes de génération
2. **Generate Wireframe** : Appelle l'API IA avec le prompt
3. **Check Status** : Vérifie si la génération a réussi
4. **Respond Success** : Renvoie le wireframe généré
5. **Respond Failure** : Renvoie une erreur en cas d'échec

### Configuration du Workflow

#### 1. Importer le Workflow dans n8n

1. Ouvrez n8n : `http://localhost:5678`
2. Cliquez sur "Import from File"
3. Sélectionnez `wireframe-workflow.json`
4. Le workflow sera importé avec tous les nœuds

#### 2. Configurer le Webhook

- **Méthode** : POST
- **Path** : `generate-wireframe`
- **URL Webhook** : `http://localhost:5678/webhook/generate-wireframe`

#### 3. Configurer l'API IA

Modifiez le nœud "Generate Wireframe" pour pointer vers votre API IA :

- **URL** : `http://127.0.0.1:8000/api/generate` (ou votre URL)
- **Méthode** : POST
- **Headers** : Authorization Bearer token
- **Body** : JSON avec le prompt

### Variables du Workflow

Le workflow accepte les variables suivantes :

```json
{
  "prompt": "Description du wireframe à générer",
  "token": "Token d'authentification API",
  "wireframeId": "ID du wireframe à mettre à jour"
}
```

### Réponse du Workflow

En cas de succès :
```json
{
  "status": "completed",
  "elements": [...],
  "wireframeId": "..."
}
```

En cas d'échec :
```json
{
  "detail": "Generation failed",
  "status": "failed"
}
```

## Intégration avec ProFlow

### Configuration Backend

Ajoutez les variables d'environnement dans le fichier `.env` du backend :

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-wireframe
AI_API_URL=http://127.0.0.1:8000/api/generate
AI_API_TOKEN=votre_token_ici
```

### Routes API Disponibles

- `POST /api/n8n/generate` - Générer un wireframe automatiquement
- `GET /api/n8n/status/:wireframeId` - Vérifier le statut d'une génération
- `GET /api/n8n/automated` - Lister les wireframes générés automatiquement
- `GET /api/n8n/templates` - Obtenir les templates de prompts
- `POST /api/n8n/webhook/update` - Webhook pour les mises à jour n8n

## Utilisation

### 1. Démarrer n8n

```bash
# Si n8n est installé localement
n8n start

# Ou avec Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Activer le Workflow

1. Ouvrez n8n dans votre navigateur
2. Activez le workflow "Wireframe Generation Workflow"
3. Le webhook sera disponible à l'URL configurée

### 3. Tester le Workflow

Utilisez curl ou Postman pour tester :

```bash
curl -X POST http://localhost:5678/webhook/generate-wireframe \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crée un dashboard admin avec sidebar et cartes",
    "token": "votre_token",
    "wireframeId": "123456"
  }'
```

### 4. Utiliser depuis ProFlow

1. Connectez-vous en tant que Designer
2. Allez dans "Génération IA (n8n)"
3. Entrez une description ou utilisez un template
4. Cliquez sur "Générer le Wireframe"

## Personnalisation

### Ajouter de nouveaux Templates

Modifiez le fichier `backend/routes/n8nRoute.js` pour ajouter des templates personnalisés :

```javascript
const templates = [
  {
    id: 'custom',
    name: 'Mon Template',
    prompt: 'Votre description personnalisée',
    description: 'Description du template'
  },
  // ... autres templates
];
```

### Modifier le Workflow

1. Ouvrez le workflow dans n8n
2. Modifiez les nœuds selon vos besoins
3. Sauvegardez et activez le workflow
4. Exportez le nouveau fichier JSON

## Dépannage

### Problèmes Courants

1. **Webhook ne répond pas**
   - Vérifiez que le workflow est activé dans n8n
   - Vérifiez que l'URL du webhook est correcte
   - Consultez les logs d'exécution dans n8n

2. **Génération échoue**
   - Vérifiez que l'API IA est accessible
   - Vérifiez le token d'authentification
   - Consultez les logs du nœud "Generate Wireframe"

3. **Timeout**
   - Augmentez le timeout dans le nœud HTTP Request
   - Vérifiez que l'API IA répond dans le temps imparti

### Logs n8n

Pour voir les logs d'exécution :
1. Cliquez sur "Executions" dans n8n
2. Sélectionnez une exécution
3. Consultez les détails de chaque nœud

### Logs Backend

Pour voir les logs du backend ProFlow :
```bash
cd backend
npm start
```

## Sécurité

### Protection du Webhook

1. Utilisez des tokens d'authentification
2. Limitez les IP autorisées
3. Utilisez HTTPS en production

### Protection de l'API IA

1. Ne stockez pas les tokens en clair
2. Utilisez des variables d'environnement
3. Faites tourner les tokens régulièrement

## Performance

### Optimisation

1. **Cache** : Implémentez un cache pour les prompts fréquents
2. **Queue** : Utilisez une file d'attente pour les générations
3. **Monitoring** : Surveillez les temps de réponse

### Scalabilité

1. **Horizontal Scaling** : Lancez plusieurs instances n8n
2. **Load Balancing** : Utilisez un load balancer pour les webhooks
3. **Database** : Utilisez une base de données externe pour n8n

## Ressources

- [Documentation n8n](https://docs.n8n.io/)
- [ProFlow Documentation](../../README.md)
- [API Backend](../backend/README.md)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 09/05/2026  
**Intégré par** : Cascade AI Assistant
