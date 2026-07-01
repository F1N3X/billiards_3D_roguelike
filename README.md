# Billiards 3D Roguelike

Prototype de billard 3D dans un environnement de salle de jeu. Le joueur vide la table en empochant toutes les boules colorées avec la boule blanche. Le projet est structuré en monorepo avec un frontend React/Three.js et un backend NestJS connecté à MongoDB Atlas.

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- npm (inclus avec Node.js)

## Installation

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

## Lancer le projet

### Backend avec Docker (recommandé en production)

```bash
docker compose up --build
```

Le backend est disponible sur [http://localhost:3000](http://localhost:3000).

> Les secrets (`MONGODB_URI`) sont lus depuis `backend/.env`, jamais embarqués dans l'image.

Le frontend produit des fichiers statiques : déploie le build sur Vercel, Netlify ou GitHub Pages.

### En local (développement)

#### Frontend — port 5173

```bash
cd frontend
npm run dev
```

#### Backend — port 3000

```bash
cd backend
npm run start:dev
```

### Build de production (sans Docker)

```bash
# Frontend
cd frontend && npm run build   # sortie dans frontend/dist/

# Backend
cd backend && npm run build    # sortie dans backend/dist/
cd backend && npm run start:prod
```

## Stack technique

### Frontend

| Outil | Rôle |
|---|---|
| [React 19](https://react.dev/) | UI et cycle de vie |
| [Three.js](https://threejs.org/) | Rendu 3D (WebGL) |
| [TypeScript](https://www.typescriptlang.org/) | Typage statique |
| [Vite](https://vite.dev/) | Bundler et serveur de dev |
| CSS Modules | Styles scoped par composant |

### Backend

| Outil | Rôle |
|---|---|
| [NestJS](https://nestjs.com/) | Framework HTTP |
| [MongoDB (driver natif)](https://www.mongodb.com/docs/drivers/node/) | Base de données |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Cluster cloud |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Hash des mots de passe |
| TypeScript | Typage statique |

## Architecture

```
billiards_3D_roguelike/
├── frontend/
│   └── src/
│       ├── BilliardsScene.tsx      # Scène Three.js principale
│       ├── App.tsx                 # Point d'entrée React
│       ├── config/
│       │   └── constants.ts        # Constantes de gameplay
│       ├── logic/
│       │   └── score.ts            # Calcul du score
│       ├── physics/
│       │   └── step-physics.ts     # Moteur physique
│       ├── scene/
│       │   ├── create-balls.ts     # Placement des boules
│       │   ├── create-cue.ts       # Queue de billard
│       │   ├── create-lamps.ts     # Éclairage
│       │   ├── create-room.ts      # Salle
│       │   └── create-table.ts     # Table
│       ├── types/
│       │   └── billiards.ts        # Types partagés
│       └── ui/
│           ├── GameHud.tsx         # HUD en jeu
│           └── VictoryScreen.tsx   # Écran de victoire
└── backend/
    └── src/
        ├── database/
        │   └── database.module.ts  # Connexion MongoDB (tokens MONGO_CLIENT / MONGO_DB)
        ├── users/                  # CRUD utilisateurs
        │   ├── users.controller.ts
        │   ├── users.service.ts
        │   ├── user.interface.ts
        │   └── dto/
        └── game-history/           # Historique des parties
            ├── game-history.controller.ts
            ├── game-history.service.ts
            ├── game-history.interface.ts
            └── dto/
```

## Base de données

**Cluster Atlas** — database : `billiards`

### Collection `users`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant MongoDB |
| `pseudo` | string | Pseudo du joueur |
| `email` | string | Adresse email (unique) |
| `passwordHash` | string | Mot de passe hashé (bcrypt, 10 rounds) |
| `createdAt` | Date | Date de création |
| `updatedAt` | Date | Date de dernière modification |

> `passwordHash` n'est jamais renvoyé dans les réponses API.

### Collection `game_history`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant MongoDB |
| `userId` | ObjectId | Référence vers `users._id` |
| `gameMode` | `"classic"` | Mode de jeu |
| `score` | number | Score final |
| `shots` | number | Nombre de coups joués |
| `playedAt` | Date | Date de la partie |

## API

### Utilisateurs — `/users`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/users` | Créer un utilisateur |
| `POST` | `/users/login` | Connexion (retourne l'utilisateur sans passwordHash) |
| `GET` | `/users` | Lister tous les utilisateurs |
| `GET` | `/users/:id` | Récupérer un utilisateur |
| `PATCH` | `/users/:id` | Modifier un utilisateur (pseudo, email, password) |
| `DELETE` | `/users/:id` | Supprimer un utilisateur |

**Corps de création :**
```json
{ "pseudo": "string", "email": "string", "password": "string" }
```

**Corps de connexion :**
```json
{ "email": "string", "password": "string" }
```

### Historique des parties — `/game-history`

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/game-history` | Enregistrer une partie |
| `GET` | `/game-history` | Lister toutes les parties |
| `GET` | `/game-history/user/:userId` | Historique d'un joueur |
| `GET` | `/game-history/:id` | Récupérer une partie |
| `DELETE` | `/game-history/:id` | Supprimer une partie |

**Corps d'enregistrement :**
```json
{ "userId": "string", "score": 0, "shots": 0, "gameMode": "classic" }
```

## Mode Rumble

Mode roguelike où le joueur gagne **+1 pièce par coup** et peut acheter des power-ups entre les tirs. La main de 4 slots est tirée aléatoirement à chaque tour (Fisher-Yates partiel sur le pool complet).

### Power-ups disponibles

| Nom | Coût | Effet |
|---|---|---|
| Clone | 6 | 4 boules blanches supplémentaires avec chacune leur queue |
| Triangle | 5 | 3 blanches en triangle (1 en pointe, 2 en éventail) |
| Triple Tir | 4 | 3 blanches en ligne dans l'axe du tir |
| Tir Explosif | 4 | Explosion radiale au premier contact blanc→coloré |
| Clonage au contact | 3 | Chaque boule touchée génère un clone coloré |
| Boule Magnétique | 3 | La(les) blanche(s) attirent les boules colorées proches |
| Tir Courbé Gauche | 2 | Arc de cercle vers la gauche (preview orange) |
| Tir Courbé Droite | 2 | Arc de cercle vers la droite (preview orange) |
| Coins Verrouillés | 2 | Bloque les 4 trous de coin pour ce tir |
| Séisme | 2 | Impulsions aléatoires continues sur 2.5s après le tir |
| Bandes Rebondissantes | 2 | Les bandes renvoient les boules à ×1.3 leur vitesse |
| Milieux Verrouillés | 1 | Bloque les 2 trous du milieu pour ce tir |
| Tapis Glissant | 1 | Friction très réduite — les boules roulent beaucoup plus loin |
| Tapis Collant | 1 | Friction très augmentée — les boules s'arrêtent rapidement |

### Mode développeur

`VITE_IS_DEV=true` dans `frontend/.env` : pièces illimitées (affichage `∞`), aucune déduction.

## Menu et navigation

L'application démarre sur un **menu principal** avec trois destinations :

- **Mode Classique** — lance une partie. Raccourci : `Entrée`.
- **Connexion / Inscription** — affiché si non connecté. Permet de créer un compte ou se connecter avec email + mot de passe.
- **Mon Compte** — affiché si connecté. Permet de modifier son pseudo.

La session est persistée dans `localStorage` (aucun token JWT). En mode classique, si le joueur est connecté et remporte la partie, le score est automatiquement sauvegardé en base via `POST /game-history`.

## Contrôles en jeu

| Action | Contrôle |
|---|---|
| Orbiter la caméra | Clic gauche + glisser |
| Zoomer / dézoomer | Molette |
| Vue libre | Clic droit + glisser |
| Orienter la visée | ← / → ou A / D |
| Frapper | Entrée ou Espace |
| Retour au menu (login/compte) | Echap |
