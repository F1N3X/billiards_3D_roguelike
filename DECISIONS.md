# Decisions

## 2026-06-30 — Séparation monorepo frontend / backend

**Décision :** Le projet est organisé en monorepo avec deux sous-projets indépendants : `frontend/` et `backend/`.

**Pourquoi :** Permettre le déploiement indépendant des deux parties, et isoler les dépendances (Three.js côté client, NestJS côté serveur). Un monorepo évite la complexité d'un multi-repo pour un projet à cette échelle.

**Alternatives rejetées :** Full-stack dans un seul projet Node (couplage fort, difficile à scaler).

---

## 2026-06-30 — Driver MongoDB natif plutôt que Mongoose

**Décision :** Le backend utilise le driver MongoDB natif (`mongodb`) sans Mongoose ni ODM.

**Pourquoi :** Le driver natif était déjà installé. Mongoose ajoute du poids (schemas, middlewares) non nécessaire pour un CRUD simple. Les types TypeScript (`User`, `GameHistory`) jouent le rôle de contrat sans surcoût à l'exécution.

**Alternatives rejetées :** Mongoose (overhead non justifié), Prisma (pas encore stable pour MongoDB à cette échelle).

---

## 2026-06-30 — Hash bcrypt pour les mots de passe, jamais renvoyé en réponse

**Décision :** Les mots de passe sont hashés avec bcrypt (10 rounds) avant stockage. Le champ `passwordHash` est exclu de toutes les réponses API via projection MongoDB.

**Pourquoi :** Règle de sécurité de base. La projection au niveau du driver garantit que le hash ne peut pas fuiter par oubli dans un nouveau endpoint.

**Alternatives rejetées :** Supprimer le champ manuellement dans le service (fragile, oubliable).

---

## 2026-06-30 — Dockerisation du backend uniquement (multi-stage Node)

**Décision :** Seul le backend est dockerisé. Le frontend n'a pas de Dockerfile.

**Pourquoi :** Le frontend ne produit que des fichiers statiques après `npm run build` — un nginx dans un container n'apporte rien de plus qu'un hébergeur statique (Vercel, Netlify, GitHub Pages), qui est plus simple, plus rapide à déployer et gratuit. Le backend en revanche bénéficie de Docker : process Node long-running, variables d'environnement sensibles, isolation.

Le Dockerfile backend est multi-stage (builder `node:20-alpine` → production `node:20-alpine`) pour exclure les `node_modules` de dev et les sources TypeScript de l'image finale.

**Alternatives rejetées :** Dockeriser aussi le frontend (complexité inutile pour des assets statiques).

---

## 2026-06-30 — Secrets via env_file, jamais dans l'image Docker

**Décision :** Le `backend/.env` (contenant `MONGODB_URI`) est chargé par docker-compose via `env_file` et est listé dans `.dockerignore`. Il n'est jamais copié dans l'image.

**Pourquoi :** Un secret commité dans une image Docker est accessible à quiconque pull l'image. L'`env_file` permet de garder les secrets hors du contexte de build.

**Alternatives rejetées :** `COPY .env` dans le Dockerfile (fuite de secrets), variables hardcodées (idem).

---

## 2026-06-30 — Authentification via localStorage (sans JWT ni sessions serveur)

**Décision :** La connexion utilise `POST /users/login` (email + mot de passe, vérification bcrypt), et l'objet utilisateur retourné est stocké en `localStorage` côté client. Aucun token JWT, aucune session serveur.

**Pourquoi :** Le projet est un prototype mono-utilisateur sans besoins de sécurité avancés. Une session JWT/serveur aurait nécessité un module auth NestJS complet (guards, stratégies Passport, refresh tokens) pour un gain nul à ce stade. Le localStorage est suffisant pour persister l'identité entre rechargements.

**Alternatives rejetées :** JWT (over-engineering pour ce prototype), sessions serveur (stateful, complexe à dockeriser), cookies httpOnly (nécessite CORS credentials + configuration CSRF).

---

## 2026-06-30 — Navigation par état React (sans routeur)

**Décision :** La navigation entre les pages (menu, connexion, compte, partie) est gérée par un état `page: 'menu' | 'login' | 'account' | 'game'` dans `AppRouter`. Pas de react-router-dom.

**Pourquoi :** Le jeu n'a pas d'URL profondes à partager ni de navigation browser (bouton retour navigateur) pertinente. Un routeur ajouterait une dépendance et une complexité inutiles. La machine à états est lisible et suffisante.

**Alternatives rejetées :** react-router-dom (over-engineering pour 4 pages sans deep-links).

---

## 2026-06-30 — Leaderboard par run individuel (pas de moyenne par joueur)

**Décision :** Le leaderboard affiche chaque run séparément. Un joueur qui a fait 2 top-10 apparaît deux fois.

**Pourquoi :** La moyenne par joueur masquait les meilleures performances individuelles et pénalisait les joueurs qui expérimentent. Un run = une ligne donne une image fidèle du meilleur jeu possible.

**Alternatives rejetées :** Grouper par userId + `$avg` (comportement précédent) — lisse les pics, fausse la compétition. "Best score per player" — n'affiche qu'une entrée par joueur, cache la progression.

---

## 2026-07-01 — Mode Rumble : architecture des power-ups

**Décision :** Le mode Rumble est un mode de jeu séparé (`RumbleGameScreen`) qui réutilise `BilliardsScene` sans le modifier en profondeur. Les effets actifs (`activeEffects: Set<ActiveEffect>`) sont passés en prop à `BilliardsScene` et lus via un ref à l'intérieur de la boucle Three.js (même pattern que `callbackRef`), sans re-monter la scène.

**Économie des pièces :** La monnaie commence à 1 et gagne +1 après chaque coup. Elle est dépensée en cliquant sur un bonus dans la main. Les effets sont effacés après chaque coup (usage unique par tir). La main de 4 slots reste fixe ; les slots sans bonus disponible affichent un placeholder "Bientôt".

**Triple Tir — coût 2 :** Quand activé, `BilliardsScene` fire 3 boules blanches successives avec le même angle depuis la même origine. L'état interne `tripleShot.remaining` décompte les tirs restants ; `onShotResolved` n'est appelé qu'une fois, après le 3e tir, avec le total des boules empochées.

**Pourquoi pas de refacto de `BilliardsScene` :** La scène est un moteur Three.js impératif dans un `useEffect`. Introduire un prop ref permet de partager l'état React avec la boucle de jeu sans re-mount coûteux ni `useImperativeHandle`.

**Pas de sauvegarde backend pour Rumble :** Le backend ne supporte pas encore le mode rumble (pas de `gameMode` dans `GameHistory`). Le score s'affiche mais n'est pas persisté.

**Alternatives rejetées :** Event bus / context pour les effets (complexité inutile pour 1 effet) ; modifier `stepPhysics` pour gérer le triple tir (mélange physique et logique de gameplay).

---

## 2026-06-30 — Sauvegarde automatique de la partie en fin de jeu (mode classique)

**Décision :** Quand un joueur connecté remporte une partie en mode classique, l'`App.tsx` déclenche automatiquement `POST /game-history` avec `userId`, `score` et `shots`. Le statut de sauvegarde (`saving` / `saved` / `error`) est affiché dans `VictoryScreen`.

**Pourquoi :** La sauvegarde est une conséquence de la victoire, pas une action utilisateur. La déclencher dans `App.tsx` (qui a accès au contexte auth et à l'état de jeu) maintient la séparation : `VictoryScreen` reste un composant d'affichage pur.

**Alternatives rejetées :** Déclencher la sauvegarde dans `VictoryScreen` (mélange logique + affichage), bouton manuel "Sauvegarder" (friction inutile).
