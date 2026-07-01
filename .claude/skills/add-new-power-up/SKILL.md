# Ajouter un nouveau power-up

## 1. Types — `frontend/src/game/powerups/types.ts`

Ajouter le `BuffEffect` et le `PowerUpId` dans les unions :

```typescript
export type BuffEffect = ... | 'monNouvelEffect'
export type PowerUpId = ... | 'mon_nouveau_powerup'
```

## 2. Fichier du power-up — `frontend/src/game/powerups/mon-nouveau-powerup.ts`

```typescript
import type { PowerUp } from './types'

export const monNouveauPowerup: PowerUp = {
  id: 'mon_nouveau_powerup',
  name: 'Nom affiché',
  description: 'Description courte pour le HUD',
  cost: 3,  // → valeur dans config/power-ups.ts si réutilisée
  createBuff: () => ({ effect: 'monNouvelEffect' }),
}
```

## 3. Enregistrement — `frontend/src/game/powerups/registry.ts`

```typescript
import { monNouveauPowerup } from './mon-nouveau-powerup'

const REGISTRY = new Map<PowerUpId, PowerUp>([
  ...
  ['mon_nouveau_powerup', monNouveauPowerup],
])
```

## 4. Implémentation de l'effet — `frontend/src/BilliardsScene.tsx`

L'effet peut se brancher à **une ou plusieurs** de ces 3 phases :

### Phase A — Visuel pendant la visée (lignes ~419-444)
Pour les effets visuels avant le tir (ex: afficher des clones, colorier des poches).
```typescript
if (activeEffectsRef.current.has('monNouvelEffect')) {
  // affichage visuel uniquement
}
```

### Phase B — Au tir dans `fireShot()` (lignes ~261-352)
Pour modifier les boules lancées (trajectoire, nombre, position de départ).
```typescript
if (effects.has('monNouvelEffect')) {
  // modifier state.extraCueBalls ou la vélocité initiale
}
```

### Phase C — Pendant le roulement dans la boucle `animate` (lignes ~446-511)
Pour des effets continus (explosion au contact, clone au contact, poches verrouillées).
```typescript
if (activeEffectsRef.current.has('monNouvelEffect')) {
  // logique frame par frame
}
```

Les poches verrouillées passent par `buildLockedPocketIndices()` → `stepPhysics()`.

## 5. Constantes

Toute valeur numérique → `frontend/src/config/constants.ts`.

## 6. Tests — `frontend/src/game/powerups/mon-nouveau-powerup.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { monNouveauPowerup } from './mon-nouveau-powerup'

describe('monNouveauPowerup', () => {
  it('crée un buff avec le bon effet', () => {
    expect(monNouveauPowerup.createBuff().effect).toBe('monNouvelEffect')
  })
})
```

## Ce qu'on ne fait PAS

- ❌ Modifier directement la position des boules hors de `stepPhysics`
- ❌ Ajouter de la logique d'effet dans le HUD ou dans un composant d'affichage
- ❌ Hardcoder le coût dans le fichier du power-up si c'est une constante de gameplay
