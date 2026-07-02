---
name: project-gameplay-scoring
description: Règles de gameplay — score, plafonds, leaderboard par run, auto-save, modes Classic vs Rumble
metadata:
  type: project
---

Logique de score dans `frontend/src/logic/score.ts`.

**Mode Classic :**
- 15 boules colorées, 1 boule blanche.
- Score = points par boule empochée (formule dans `score.ts`).
- Plafond serveur : **9 000 pts** (15 boules en 1 coup = ~6 750 + bonus rapidité max ~1 900 = ~8 650, marge de 350).
- Sauvegarde automatique à la victoire via `POST /game-history` (avec `sessionId` single-use).
- Leaderboard : chaque run = une ligne (pas de moyenne par joueur).

**Mode Rumble :**
- Économie pièces : commence à 1 pièce, +1 par coup.
- Main de 4 power-ups tirés aléatoirement (Fisher-Yates partiel) depuis le pool complet à chaque tour.
- Effets actifs pour ce tir uniquement — effacés après chaque coup.
- **Pas de sauvegarde backend** — le score s'affiche en fin de partie mais n'est pas persisté.
- Pas de plafond de score : `clone_on_contact` peut créer `15 × 2ⁿ` boules après n tirs → croissance exponentielle inbornée.

**Mode dev (`VITE_IS_DEV=true`) :**
Pièces illimitées, affichage `∞`. Constante `IS_DEV` lue une seule fois au module-load depuis `import.meta.env.VITE_IS_DEV`, partagée entre `App.tsx` et `RumbleHud.tsx`.

**Condition de victoire :**
Déterminée uniquement par l'état de la partie (toutes les boules colorées empochées), jamais par l'UI.

**Why:** Leaderboard par run → fidèle aux meilleures performances individuelles, ne pénalise pas les joueurs qui expérimentent. Auto-save dans `App.tsx` → `VictoryScreen` reste un composant d'affichage pur.

**How to apply:** Pour ajouter un nouveau mode de jeu, utiliser le skill `add-game-mode`. Pour étendre le score, modifier `score.ts` et mettre à jour le plafond dans `GameSessionsService` si le mode est persisté.
