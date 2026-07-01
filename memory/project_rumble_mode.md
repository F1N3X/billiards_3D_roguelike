---
name: project-rumble-mode
description: Mode Rumble — architecture power-ups, économie pièces, registry pattern, 14 power-ups actifs, physique et coûts rééquilibrés
metadata:
  type: project
---

Mode Rumble ajouté le 2026-07-01, enrichi le 2026-07-01.

**Why:** Mode roguelike avec bonus achetables — le joueur gagne +1 pièce par coup et achète des effets pour ce tir uniquement.

**Architecture power-ups (pattern registry) :**
- `frontend/src/game/powerups/types.ts` — unions `BuffEffect` et `PowerUpId`
- `frontend/src/game/powerups/<nom>.ts` — un fichier par bonus (`id`, `name`, `description`, `cost`, `createBuff()`)
- `frontend/src/game/powerups/registry.ts` — `PowerUpRegistry.get(id)` / `PowerUpRegistry.all()`
- `frontend/src/game/powerups/<nom>.test.ts` — test de coût, d'id et de createBuff pour chaque bonus

**14 power-ups actifs (coût) :**
clone(6), triple_shot_triangle(5), triple_shot(4), explosive_shot(4), clone_on_contact(3), magnetic_cue(3), curve_left(2), curve_right(2), lock_corner_pockets(2), seisme(2), bouncy_walls(2), lock_middle_pockets(1), slippery_felt(1), sticky_felt(1)

**Économie:** commence à 1 pièce, +1 par coup. Main de 4 slots tirée aléatoirement (Fisher-Yates) à chaque tour depuis le pool complet. Effets effacés après chaque coup.

**Communication BilliardsScene:** `activeEffects?: Set<BuffEffect>` prop lu via `activeEffectsRef.current` dans la boucle Three.js. `buildStepPhysicsOpts(effects)` traduit les effets actifs en `StepPhysicsOpts` passées à `stepPhysics`.

**Physique notable :**
- Friction multiplicative : `FRICTION = 0.978` (~4s pour s'arrêter depuis vitesse max)
- `MAX_BALL_SPEED = 8.0` — plafond après chaque rebond (anti-softlock bandes rebondissantes)
- `BOUNCY_WALLS_RESTITUTION = 1.3` (réduit depuis 1.5 pour garantir convergence)
- Magnétique après stepPhysics, force `MAGNET_FORCE = 4.0`, rayon `MAGNET_RADIUS = 1.2`, nearest-only
- Courbe : force perpendiculaire `(-vz, vx) * CURVE_FORCE * dt` avant stepPhysics ; preview = quart de cercle géométrique

**Mode dev:** `VITE_IS_DEV=true` → pièces illimitées, aucune déduction.

**Pas de backend Rumble:** scores non persistés.

**How to apply:** Pour ajouter un nouveau power-up, utiliser le skill `add-new-power-up`.
