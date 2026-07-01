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

---

## 2026-07-01 — Power-ups de verrouillage de trous (Coins / Milieux)

**Décision :** Deux nouveaux power-ups Rumble : `lock_corner_pockets` (verrouille les 4 coins) et `lock_middle_pockets` (verrouille les 2 trous du milieu), coûtant 3 pièces chacun.

**Mécanique :** `stepPhysics` reçoit un paramètre optionnel `lockedPocketIndices?: Set<number>`. Quand un trou est dans ce set, sa détection de « balle aspirée » est sautée : la balle continue de rouler normalement à travers la zone. Les indices 0–3 de `POCKET_XZ` sont les coins, 4–5 les milieux — cohérent avec `create-table.ts`.

**Visuel :** `BilliardsScene` crée un disc 3D semi-transparent (rouge pour les coins, orange pour les milieux) positionné au-dessus de chaque trou concerné. La visibilité est mise à jour à chaque frame dans la boucle `animate` via `activeEffectsRef` (même pattern que les autres effets).

**Synergies :** Les deux effets sont cumulables ; `buildLockedPocketIndices` combine les deux sets.

**Pourquoi modifier `stepPhysics` plutôt que `BilliardsScene` seul :** La règle « ce trou ne gobe pas les boules » est une règle physique, pas visuelle. L'exclure du moteur physique est la source de vérité correcte.

**Alternatives rejetées :** Filtrer les boules tombées dans `BilliardsScene` après coup (trop tard, la balle est déjà `active = false`) ; ajouter une géométrie de collision pour les trous (complexité inutile dans ce moteur custom).

---

## 2026-07-01 — Mode dev : pièces illimitées + main aléatoire à chaque tour

**Décision :** `VITE_IS_DEV=true` dans `frontend/.env` active un mode développeur dans le mode Rumble. En mode dev : pas de déduction de pièces, affichage `∞` dans le HUD. Indépendamment du mode dev, la main de 4 power-ups est désormais retirée aléatoirement du pool à chaque tour (Fisher-Yates partiel dans `drawHand()`).

**Pourquoi :** Le mode dev évite de rejouer pour tester chaque power-up. La main aléatoire par tour change le gameplay d'une liste fixe (boring) vers une mécanique de draft tournante, cohérente avec l'intention roguelike.

**`IS_DEV` lu une seule fois** au module-load depuis `import.meta.env.VITE_IS_DEV` — pas de state React, pas de contexte. La constante est partagée entre `App.tsx` et `RumbleHud.tsx`.

**Alternatives rejetées :** Utiliser `.env.development` (plus propre mais plus complexe pour un simple toggle) ; currency infinie via une valeur élevée (masque le vrai compteur).

---

## 2026-07-01 — Power-up Tir Explosif

**Décision :** `explosive_shot` déclenche une explosion radiale au premier contact boule blanche → boule colorée. Toutes les boules actives dans un rayon `EXPLOSION_RADIUS = 0.6` reçoivent une impulsion radiale avec décroissance linéaire (`EXPLOSION_FORCE * (1 - dist/radius)`).

**Détection du contact :** après chaque appel `stepPhysics`, on vérifie si une boule blanche est à moins de `BALL_RADIUS * 2 * 1.15` d'une boule colorée (le facteur 1.15 absorbe la correction de séparation interne de `stepPhysics` qui laisse les boules à `2*BALL_RADIUS + 0.001` après collision). L'explosion ne se déclenche qu'une fois par tir (`state.explosionTriggered`), réinitialisé dans `fireShot()`.

**Visuel :** un anneau 3D (`RingGeometry`) au point de contact se dilate de 0 à `EXPLOSION_RADIUS` en 0.4s avec un fondu. L'animation tourne en dehors des branches de phase pour finir même après la fin du rolling.

**Pourquoi dans BilliardsScene plutôt que stepPhysics :** l'explosion est une règle de gameplay (premier contact cue→colored), pas une règle physique générale. La placer dans `stepPhysics` l'obligerait à connaître la notion de "boule blanche", ce qui sortirait du rôle du moteur physique.

---

## 2026-07-01 — Power-up Clonage au contact

**Décision :** `clone_on_contact` clone chaque boule colorée touchée par la boule blanche : un exemplaire identique (même géométrie, matériau cloné) apparaît en position aléatoire libre sur la table. Le clone est intégré directement dans `ballStates` (pas dans un tableau parallèle) pour qu'il participe nativement à la physique, au comptage de boules et à la condition de victoire.

**Comptage des boules pottées :** quand un clone est ajouté pendant le rolling, `state.activeBeforeShot` est incrémenté de 1. Ainsi le calcul `ballsPotted = activeBeforeShot - coloredNow` reste correct : il tient compte des clones créés ET des clones pottés pendant ce même tir.

**Anti-boucle infinie :** `state.clonedBallsThisShot: Set<THREE.Mesh>` enregistre la boule source ET la boule clone dès la création. Une boule déjà dans ce set ne peut plus être clonée pendant le même tir, empêchant les chaînes exponentielles. Le set est vidé à la fin du rolling (via `state.clonedBallsThisShot.clear()`).

**Les clones persistent d'un tir à l'autre** : intégrés à `ballStates`, ils restent sur la table jusqu'à être empochés. À partir du tir suivant, ils peuvent eux-mêmes être clonés si l'effet est encore actif.

**Synergies :** fonctionne avec tous les autres effets (tripleShot, tripleTriangle, lockPockets, explosiveShot) sans code conditionnel supplémentaire. Les clones participent à l'explosion et aux tirs multiples comme n'importe quelle boule colorée.

**Coût :** 3 pièces — moins cher que l'explosif (4) car l'effet augmente le nombre de boules à empocher, ce qui est double tranchant.

**Alternatives rejetées :** Tableau `extraColoredBalls` séparé (duplicating la logique de comptage de boules) ; spawner le clone à la position de la boule source (superposition immédiate → physique instable) ; cloner vers la position de la queue de billard (pas toujours libre).
