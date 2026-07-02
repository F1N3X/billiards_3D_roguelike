---
name: project-frontend-architecture
description: Architecture frontend — navigation par état React, BilliardsScene impérative, pattern ref pour communication Three.js/React
metadata:
  type: project
---

Frontend React + Three.js dans `frontend/src/`.

**Navigation (sans react-router) :**
`AppRouter` dans `App.tsx` gère un état `page: 'menu' | 'login' | 'account' | 'game'`. Pas de `react-router-dom` — le jeu n'a pas d'URL profondes ni de bouton retour navigateur pertinent.

**Pages / composants UI :**
- `MainMenu` — choix du mode (classique ou Rumble), accès compte, leaderboard
- `LoginPage` — login + register
- `AccountPage` — stats utilisateur
- `GameDashboard` — wrapper du mode classique (`BilliardsScene`)
- `RumbleGameScreen` — wrapper du mode Rumble (réutilise `BilliardsScene` + `RumbleHud`)
- `VictoryScreen` — affiche score + statut de sauvegarde

**BilliardsScene — moteur Three.js impératif :**
- Toute la simulation tourne dans un `useEffect` avec une boucle `requestAnimationFrame` (`animate()`).
- Les composants React ne voient que des props ; la scène Three.js est autonome.
- Communication React → Three.js via refs : `activeEffectsRef`, `callbackRef`, `shotAngleRef`, etc.
- Re-monter la scène est coûteux → on préfère passer des états via refs pour éviter les démontages.

**Pattern ref pour les effets actifs :**
`activeEffects?: Set<BuffEffect>` est passé en prop à `BilliardsScene` et lu via `activeEffectsRef.current` dans la boucle `animate`. Pas de context ni event bus — une seule source de vérité synchronisée par ref.

**Sauvegarde automatique en fin de partie (mode classique) :**
`App.tsx` (avec accès à `AuthContext` + état de jeu) déclenche `POST /game-history` à la victoire. `VictoryScreen` est un composant d'affichage pur qui reçoit le statut (`saving` / `saved` / `error`).

**Leaderboard :** chaque run est une ligne indépendante — un joueur qui a fait 2 top-10 apparaît deux fois. Pas de moyenne par joueur.

**Why:** Routeur inutile pour 4 pages sans deep-links. BilliardsScene impérative pour ne pas re-monter le moteur Three.js à chaque changement d'état React.

**How to apply:** Pour ajouter une page, étendre l'union `page` dans `AppRouter`. Pour partager de l'état avec la boucle Three.js, utiliser un ref mis à jour depuis React plutôt qu'un prop qui provoquerait un re-render.
