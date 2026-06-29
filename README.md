# Billiards 3D Roguelike

Prototype de billard 3D dans un environnement de salle de jeu, construit avec React, Three.js et TypeScript.

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- npm (inclus avec Node.js)

## Installation

```bash
npm install
```

## Lancer le projet

### Mode développement (avec hot-reload)

```bash
npm run dev
```

Ouvre ensuite [http://localhost:5173](http://localhost:5173) dans le navigateur.

### Build de production

```bash
npm run build
```

Les fichiers compilés se trouvent dans `dist/`.

### Prévisualiser le build de production

```bash
npm run preview
```

## Stack technique

| Outil | Rôle |
|---|---|
| [React 19](https://react.dev/) | UI et gestion du cycle de vie |
| [Three.js](https://threejs.org/) | Rendu 3D (WebGL) |
| [TypeScript](https://www.typescriptlang.org/) | Typage statique |
| [Vite](https://vite.dev/) | Bundler et serveur de dev |

## Contrôles

| Action | Contrôle |
|---|---|
| Orbiter la caméra | Clic gauche + glisser |
| Zoomer / dézoomer | Molette |
| Pivoter en vue libre | Clic droit + glisser |

## Structure du projet

```
src/
├── BilliardsScene.tsx   # Scène Three.js (table, boules, salle, lumières)
├── App.tsx              # Point d'entrée React
└── main.tsx             # Bootstrap React
```
