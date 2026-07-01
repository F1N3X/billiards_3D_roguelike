# Ajouter une règle physique

La physique est centralisée dans `frontend/src/physics/step-physics.ts`.
Ne jamais recalculer de physique ailleurs.

## Signature actuelle

```typescript
export function stepPhysics(
  balls: BallState[],
  dt: number,
  lockedPocketIndices?: Set<number>  // paramètre optionnel ajouté pour lock-pockets
)
```

## Pattern pour étendre

### Option A — Nouveau paramètre optionnel (règle globale)

Ajouter un paramètre optionnel à `stepPhysics` et l'appeler depuis `BilliardsScene.tsx` :

```typescript
export function stepPhysics(
  balls: BallState[],
  dt: number,
  lockedPocketIndices?: Set<number>,
  maNouvelleregle?: MaConfig   // ← nouveau
)
```

Appel dans BilliardsScene.tsx (ligne ~449) :
```typescript
stepPhysics([...ballStates, ...state.extraCueBalls], dt, lockedPockets, maConfig)
```

### Option B — Hook dans la boucle d'animation (règle liée à un effect)

Si la règle est liée à un `BuffEffect` actif, la placer dans la boucle `animate` de BilliardsScene.tsx, après l'appel `stepPhysics`, comme `explosiveShot` et `cloneOnContact` :

```typescript
// Après stepPhysics(...)
if (activeEffectsRef.current.has('monEffect')) {
  appliquerMaRegle(ballStates)
}
```

## Phases physiques dans step-physics.ts (ordre)

1. **Friction & mouvement** — appliquer friction exponentielle, stopper sous `MIN_SPEED`
2. **Collisions boule-boule** — O(n²), impulsion élastique
3. **Détection poches** — skip si `lockedPocketIndices`, désactiver boule empochée
4. **Rebonds murs** — inverser vélocité × 0.75 sur les bords

Insérer la nouvelle règle à la phase logiquement cohérente.

## Constantes

Toutes les valeurs numériques → `frontend/src/config/constants.ts`.
Exemples existants : `EXPLOSION_RADIUS = 0.9`, `EXPLOSION_FORCE = 10.0`.

## Ce qu'on ne fait PAS

- ❌ Modifier la position d'une boule directement depuis un composant React
- ❌ Dupliquer la logique de collision
- ❌ Appeler stepPhysics depuis plusieurs endroits
- ❌ Hardcoder des valeurs physiques dans step-physics.ts (→ constants.ts)
