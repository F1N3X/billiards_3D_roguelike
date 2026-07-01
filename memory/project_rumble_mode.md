---
name: project-rumble-mode
description: Mode Rumble — architecture power-ups, économie de pièces, effets actifs dans BilliardsScene
metadata:
  type: project
---

Mode Rumble ajouté le 2026-07-01.

**Why:** Le joueur voulait un mode roguelike avec des bonus achetables entre les tours.

**Architecture:**
- `types/power-up.ts` — `PowerUp`, `ActiveEffect` types
- `config/power-ups.ts` — définitions et coûts (Triple Tir = 2 pièces)
- `logic/power-up-pool.ts` — `drawInitialHand()` → 4 slots (1 actif + 3 locked)
- `ui/RumbleHud.tsx` + `RumbleHud.module.css` — barre en bas avec pièces + 4 cartes
- `RumbleGameScreen` dans `App.tsx` — gère currency, hand, activeEffects

**Économie:** commence à 1 pièce, +1 par coup. Triple Tir coûte 2 → accessible dès le tour 2.

**Communication BilliardsScene:** `activeEffects?: Set<ActiveEffect>` prop lu via `activeEffectsRef.current` dans la boucle Three.js (même pattern que `callbackRef`). Effects effacés après chaque coup.

**Triple Tir dans BilliardsScene:** `state.tripleShot.remaining` décompte les sub-shots. `onShotResolved` appelé une seule fois après le 3e tir.

**Pas de backend Rumble:** scores non persistés (leaderboard vide, savedStatus=null).

**How to apply:** Pour ajouter un nouveau power-up: ajouter à `POWER_UP_DEFINITIONS`, étendre `PowerUpId`/`ActiveEffect`, gérer l'effet dans BilliardsScene, ajouter au POOL dans `power-up-pool.ts`.
