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

> Les secrets (`MONGODB_URI`, `JWT_SECRET`) sont lus depuis `backend/.env`, jamais embarqués dans l'image.

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
| [@nestjs/jwt](https://github.com/nestjs/jwt) | Tokens JWT (HS256, 7j) |
| [MongoDB (driver natif)](https://www.mongodb.com/docs/drivers/node/) | Base de données |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Cluster cloud |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Hash des mots de passe |
| TypeScript | Typage statique |

## Architecture

```
billiards_3D_roguelike/
├── frontend/
│   └── src/
│       ├── BilliardsScene.tsx          # Scène Three.js principale (moteur impératif)
│       ├── App.tsx                     # Point d'entrée React + AppRouter (état page)
│       ├── api/
│       │   └── api.ts                  # Appels HTTP (Authorization: Bearer <token>)
│       ├── auth/
│       │   └── auth-context.tsx        # AuthContext — utilisateur connecté + token JWT
│       ├── config/
│       │   ├── constants.ts            # Constantes de gameplay
│       │   └── power-ups.ts            # Constantes des power-ups
│       ├── game/
│       │   └── powerups/               # Un fichier par power-up + registry + types
│       ├── logic/
│       │   ├── score.ts                # Calcul du score
│       │   └── power-up-pool.ts        # Tirage aléatoire de la main Rumble
│       ├── physics/
│       │   └── step-physics.ts         # Moteur physique (source de vérité des positions)
│       ├── scene/
│       │   ├── create-balls.ts         # Placement des boules
│       │   ├── create-cue.ts           # Queue de billard
│       │   ├── create-lamps.ts         # Éclairage
│       │   ├── create-room.ts          # Salle
│       │   └── create-table.ts         # Table + définition des trous
│       ├── types/
│       │   ├── billiards.ts            # Types physique / scène
│       │   ├── game.ts                 # Types mode de jeu
│       │   └── user.ts                 # Types utilisateur / auth
│       └── ui/
│           ├── MainMenu.tsx            # Menu principal
│           ├── LoginPage.tsx           # Connexion / inscription
│           ├── AccountPage.tsx         # Page compte utilisateur
│           ├── GameDashboard.tsx       # Wrapper mode classique
│           ├── RumbleHud.tsx           # HUD mode Rumble (pièces + main)
│           ├── VictoryScreen.tsx       # Écran de victoire
│           └── Leaderboard.tsx         # Classement
└── backend/
    └── src/
        ├── database/
        │   └── database.module.ts      # Connexion MongoDB (tokens MONGO_CLIENT / MONGO_DB)
        ├── auth/                       # JwtAuthGuard (HS256, sans Passport)
        ├── users/                      # CRUD utilisateurs + login
        │   ├── users.controller.ts
        │   ├── users.service.ts
        │   ├── user.interface.ts
        │   └── dto/
        ├── game-history/               # Historique des parties
        │   ├── game-history.controller.ts
        │   ├── game-history.service.ts
        │   ├── game-history.interface.ts
        │   └── dto/
        └── game-sessions/              # Tokens de session single-use (TTL 2h)
            ├── game-sessions.controller.ts
            └── game-sessions.service.ts
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

> `passwordHash` n'est jamais renvoyé dans les réponses API (projection MongoDB).

### Collection `game_history`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant MongoDB |
| `userId` | ObjectId | Référence vers `users._id` |
| `sessionId` | string | Token de session single-use (requis) |
| `gameMode` | `"classic"` | Mode de jeu |
| `score` | number | Score final |
| `shots` | number | Nombre de coups joués |
| `playedAt` | Date | Date de la partie |

### Collection `game_sessions`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant MongoDB |
| `userId` | ObjectId | Référence vers `users._id` |
| `used` | boolean | `true` après consommation (single-use) |
| `createdAt` | Date | Date de création (TTL 2h) |

## API

### Authentification

`POST /users/login` retourne `{ user, token }`. Le token JWT (HS256, 7j) doit être envoyé en `Authorization: Bearer <token>` sur les routes protégées. `POST /users` (register) retourne également `{ user, token }` — l'utilisateur est connecté dès la création de compte.

### Routes protégées par JWT

`PATCH /users/:id`, `DELETE /users/:id`, `POST /game-history`, `DELETE /game-history/:id`, `POST /game-sessions/start`.

### Utilisateurs — `/users`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/users` | — | Créer un utilisateur (retourne `{ user, token }`) |
| `POST` | `/users/login` | — | Connexion (retourne `{ user, token }`) |
| `GET` | `/users` | — | Lister tous les utilisateurs |
| `GET` | `/users/:id` | — | Récupérer un utilisateur |
| `PATCH` | `/users/:id` | JWT | Modifier un utilisateur |
| `DELETE` | `/users/:id` | JWT | Supprimer un utilisateur |

**Corps de création :**
```json
{ "pseudo": "string", "email": "string", "password": "string" }
```

**Corps de connexion :**
```json
{ "email": "string", "password": "string" }
```

### Historique des parties — `/game-history`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/game-history` | JWT | Enregistrer une partie |
| `GET` | `/game-history` | — | Lister toutes les parties |
| `GET` | `/game-history/user/:userId` | — | Historique d'un joueur |
| `GET` | `/game-history/:id` | — | Récupérer une partie |
| `DELETE` | `/game-history/:id` | JWT | Supprimer une partie |

**Corps d'enregistrement :**
```json
{ "userId": "string", "sessionId": "string", "score": 0, "shots": 0, "gameMode": "classic" }
```

### Sessions de jeu — `/game-sessions`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/game-sessions/start` | JWT | Créer une session single-use (retourne `{ sessionId }`, TTL 2h) |

> Le `sessionId` doit être obtenu avant de démarrer une partie et transmis avec le score en fin de partie. Il ne peut être utilisé qu'une seule fois.

## Mode Rumble

Mode roguelike où le joueur gagne **+1 pièce par coup** et peut acheter des power-ups entre les tirs. La main de 4 slots est tirée aléatoirement à chaque tour (Fisher-Yates partiel sur le pool complet). Les effets sont actifs pour ce tir uniquement. Les scores Rumble ne sont pas persistés en base.

### Power-ups disponibles

| Nom | Coût | Effet |
|---|---|---|
| Clone | 6 | 4 boules blanches supplémentaires avec chacune leur queue |
| Triangle | 5 | 3 blanches en triangle (1 en pointe, 2 en éventail) |
| Triple Tir | 4 | 3 blanches en ligne dans l'axe du tir |
| Tir Explosif | 4 | Explosion radiale au premier contact blanc→coloré |
| Clonage au contact | 3 | Chaque boule touchée génère un clone coloré persistant |
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

La navigation est gérée par un état React (`page: 'menu' | 'login' | 'account' | 'game'`) dans `AppRouter` — pas de `react-router-dom`. La session est persistée dans `localStorage` via un token JWT. En mode classique, si le joueur est connecté et remporte la partie, le score est automatiquement sauvegardé en base via `POST /game-history`.

## Contrôles en jeu

| Action | Contrôle |
|---|---|
| Orbiter la caméra | Clic gauche + glisser |
| Zoomer / dézoomer | Molette |
| Vue libre | Clic droit + glisser |
| Orienter la visée | ← / → ou A / D |
| Frapper | Entrée ou Espace |
| Retour au menu (login/compte) | Echap |
