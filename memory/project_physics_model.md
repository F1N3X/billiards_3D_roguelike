---
name: project-physics-model
description: Modèle physique — friction multiplicative, MAX_BALL_SPEED, StepPhysicsOpts, poches verrouillables
metadata:
  type: project
---

Moteur physique centralisé dans `frontend/src/physics/step-physics.ts`. Source de vérité des positions — jamais recalculé dans React.

**Friction multiplicative :**
`v *= FRICTION^(dt*60)` avec `FRICTION = 0.978`. Décroissance exponentielle (~4s pour s'arrêter depuis vitesse max). Pas une décélération constante (Coulomb) — la boule décélère vite au départ et progressivement quand elle ralentit, ce qui donne le feeling billard.

**Plafond de vitesse :**
`MAX_BALL_SPEED = 8.0` appliqué après chaque rebond sur les bandes. Sans ce plafond, `bouncy_walls` (restitution 1.3×) peut créer un cycle stable où la vitesse augmente indéfiniment.

**`StepPhysicsOpts` — extensibilité sans breaking change :**
Options passées à `stepPhysics` pour ce tir :
- `frictionOverride` — remplace `FRICTION` (slippery/sticky felt)
- `wallRestitution` — remplace la restitution standard des bandes
- `lockedPocketIndices?: Set<number>` — indices des trous désactivés pour ce tir (0–3 = coins, 4–5 = milieux)

**Poches :**
Indices définis dans `POCKET_XZ` de `create-table.ts`. Quand un index est dans `lockedPocketIndices`, la détection "boule aspirée" est sautée — la boule continue de rouler à travers la zone. `buildLockedPocketIndices(effects)` combine les effets `lock_corner_pockets` et `lock_middle_pockets`.

**`buildStepPhysicsOpts(effects)` :**
Dans `BilliardsScene`, traduit le `Set<BuffEffect>` actif en `StepPhysicsOpts` avant chaque appel à `stepPhysics`.

**Why:** Un objet options est extensible sans modifier la signature de `stepPhysics`. Les règles de trou verrouillé sont physiques (pas visuelles) → elles appartiennent au moteur.

**How to apply:** Pour ajouter une règle physique dépendant d'un power-up, ajouter un champ dans `StepPhysicsOpts`, le lire dans `stepPhysics`, et mapper l'effet dans `buildStepPhysicsOpts`. Utiliser le skill `add-physics-rule`.
