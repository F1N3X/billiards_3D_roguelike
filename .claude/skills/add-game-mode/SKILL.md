# Ajouter un nouveau mode de jeu

Référence : le mode Rumble est le modèle à suivre.

## Checklist

### 1. Routing — `frontend/src/App.tsx`

Ajouter le nouveau mode au type `Page` :
```typescript
type Page = 'menu' | 'login' | 'account' | 'game' | 'rumble' | 'nouveau-mode'
```

Créer le composant `NouveauModeGameScreen` dans App.tsx (même niveau que `RumbleGameScreen`).
Il doit utiliser le reducer partagé `reduce` + son propre état local si nécessaire.

Ajouter le rendu conditionnel dans `AppRouter` :
```typescript
if (page === 'nouveau-mode') return <NouveauModeGameScreen onMenu={() => setPage('menu')} />
```

### 2. Menu — `frontend/src/ui/MainMenu.tsx`

Ajouter un callback `onPlayNouveauMode` dans les props et un bouton dans le JSX.

### 3. Types — `frontend/src/types/`

Si le mode introduit un nouveau `gameMode`, l'ajouter dans le type `GameMode` :
```typescript
type GameMode = 'classic' | 'rumble' | 'nouveau-mode'
```

### 4. HUD spécifique (si nécessaire)

- Nouveau composant React dans `frontend/src/ui/`
- CSS module associé
- Respecter la règle : le composant n'affiche que, la logique reste dans le Screen

### 5. Constantes de gameplay

Toutes les valeurs numériques du mode → `frontend/src/config/power-ups.ts` ou `constants.ts`.
Jamais de magic numbers dans les composants.

### 6. BilliardsScene

`BilliardsScene` est partagée entre tous les modes via ses props.
Ne pas y ajouter de logique spécifique à un mode — passer des callbacks et des effets actifs.

## Ce qu'on ne fait PAS

- ❌ Dupliquer `BilliardsScene` pour un nouveau mode
- ❌ Dupliquer le reducer `reduce` (il est partagé)
- ❌ Mettre la logique métier du mode dans le HUD
- ❌ Hardcoder les constantes du mode dans le composant
