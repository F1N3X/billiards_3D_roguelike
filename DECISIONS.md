# Decisions

## 2026-07-10 — Système de frappe : puissance dynamique + visée inversée

**Décision :** La puissance du tir est désormais déterminée par la distance entre la souris et la boule blanche (plus la souris est éloignée, plus la frappe est puissante). La queue se positionne du côté de la souris (derrière la boule blanche, du point de vue du joueur). La direction de tir est opposée à la position de la souris — on vise derrière la boule pour indiquer la direction du coup.

**Pourquoi :** L'ancienne mécanique de puissance fixe (`SHOT_POWER = 6.0`) ne donnait aucun contrôle tactique. Le placement de la queue derrière les boules de couleur était contre-intuitif ; positionner la souris derrière la boule blanche correspond à la gestuelle naturelle du billard réel.

**Implémentation :**
- `MAX_SHOT_POWER = 6.0`, `MIN_SHOT_POWER = 0.5`, `MAX_AIM_DISTANCE = 1.5` (unités table).
- `POWER_CUE_OFFSET = 0.35` : la queue recule visuellement jusqu'à +0.35 unités à pleine puissance.
- `aimAngle` toujours calculé comme l'angle vers la souris ; le tir se produit dans la direction `aimAngle + π`.
- La ligne de visée et la queue reflètent la direction de tir réelle.

**Alternatives rejetées :** Barre de puissance cliquable (UX moins immersive, rupture de flux).

---

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

## 2026-07-01 — Intégrité des scores via token de session de jeu

**Décision :** Avant de démarrer une partie, le frontend appelle `POST /game-sessions/start` (JWT requis) → reçoit un `sessionId`. En fin de partie, ce `sessionId` est envoyé avec le score dans `POST /game-history`. Le backend valide : session existante, appartient à l'utilisateur JWT, non expirée (TTL 2h), non encore utilisée, score ≤ plafond physique du mode.

**Plafond (Classic uniquement) :** 9 000 pts — 15 boules en 1 coup = 6 750 + bonus rapidité max 1 900 = 8 650, marge de 350.

**Pas de plafond pour Rumble :** `clone_on_contact` crée des boules persistantes entre les tirs. Après `n` tirs de clonage, on peut avoir jusqu'à `15 × 2ⁿ` boules ; le score d'un seul tir avec N boules est `25N² + 75N`, ce qui dépasse 100 000 en quelques tirs. Tout plafond fini serait soit trop bas (faux positifs sur des parties légitimes) soit trop haut (inutile). La protection Rumble repose uniquement sur le token de session (single-use, lié au JWT, TTL 2h).

**Ce que ça bloque :** un utilisateur connecté ne peut pas envoyer `{ score: 999999 }` directement à `POST /game-history` — il a besoin d'un `sessionId` frais issu du serveur, lié à son JWT, single-use.

**Ce que ça ne bloque pas :** un bot qui joue vraiment la partie pour obtenir un sessionId valide. La simulation physique côté serveur serait la seule protection absolue, mais elle impliquerait de porter le moteur `stepPhysics` côté backend — hors scope pour ce projet.

**Alternatives rejetées :** HMAC du score côté client (le secret serait exposé dans le bundle JS) ; replay serveur complet (nécessite un moteur physique identique côté backend, non déterministe entre Node et navigateur) ; validation uniquement par plafond de score (sans sessionId, n'importe qui peut POSTer).

---

## 2026-07-01 — Authentification JWT signée côté serveur

**Décision :** `POST /users/login` retourne `{ user, token }` où `token` est un JWT signé (HS256, expiration 7j) avec `@nestjs/jwt`. Le secret est dans `.env` (`JWT_SECRET`). Le token est stocké dans `localStorage` via `AuthContext` et envoyé en `Authorization: Bearer <token>` sur les routes protégées.

**Routes protégées :** `PATCH /users/:id`, `DELETE /users/:id`, `POST /game-history`, `DELETE /game-history/:id` — toutes les mutations qui requirent une identité. Les routes de lecture publique (leaderboard, stats, register, login) restent ouvertes.

**`JwtAuthGuard`** : guard NestJS autonome (sans Passport) qui vérifie la signature du JWT via `JwtService.verify()`. Attaché aux routes via `@UseGuards(JwtAuthGuard)`.

**Inscription :** `POST /users` (register) enchaîne automatiquement un `POST /users/login` pour retourner un token directement — l'utilisateur est connecté dès la création de compte.

**Pourquoi remplacer l'approche sans token :** Les routes mutantes étaient accessibles à n'importe qui connaissant un `userId`. Avec le JWT, seul le propriétaire du token peut modifier/supprimer son compte ou sauvegarder une partie.

**Alternatives rejetées :** Passport.js (surcouche lourde pour ce cas simple) ; cookies httpOnly (CORS credentials + CSRF sur un frontend Vite séparé du backend) ; sessions serveur (stateful, incompatible avec Docker stateless).

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

---

## 2026-07-01 — 7 nouveaux power-ups Rumble (Séisme, Bandes, Tapis, Magnétique, Courbes)

**Décision :** Ajout de 7 power-ups au mode Rumble, tous suivant le pattern registry existant (`PowerUp` + `BuffEffect` union + fichier dédié + test).

**Séisme (`seisme`)** : au tir, un timer `seismeRemaining` décroit pendant `SEISME_DURATION = 2.5s`. Chaque frame, une impulsion aléatoire `SEISME_IMPULSE_PER_SEC * dt` est appliquée à toutes les boules actives. L'effet est continu et progressif (pas un one-shot), ce qui le rend visuellement lisible.

**Bandes Rebondissantes (`bouncyWalls`)** : `wallRestitution = BOUNCY_WALLS_RESTITUTION` est passé en option à `stepPhysics` via `StepPhysicsOpts`. Réduit à `1.3` (au lieu du `1.5` initial) pour éviter les cycles stables à `MAX_BALL_SPEED`.

**Tapis Glissant / Collant (`slipperyFelt` / `stickyFelt`)** : `frictionOverride` dans `StepPhysicsOpts` remplace `FRICTION` par `SLIPPERY_FRICTION = 0.993` ou `STICKY_FRICTION = 0.958` pour ce tir.

**Boule Magnétique (`magneticCue`)** : après chaque `stepPhysics`, les boules colorées dans `[BALL_RADIUS*5, MAGNET_RADIUS]` sont attirées vers la blanche la plus proche ("nearest-only" pour éviter l'accumulation de forces concurrentes). Force `MAGNET_FORCE = 4.0`, rayon `MAGNET_RADIUS = 1.2`.

**Tir Courbé G/D (`curveLeft` / `curveRight`)** : une force perpendiculaire à la vitesse des blanches (`(-vz, vx) * CURVE_FORCE * dt`) est appliquée avant `stepPhysics` à chaque frame. La preview de visée est remplacée par un arc géométrique (quart de cercle de rayon `SHOT_POWER / CURVE_FORCE`) affiché en orange.

**Pourquoi `StepPhysicsOpts` plutôt que des paramètres séparés :** l'ajout de plusieurs options optionnelles à `stepPhysics` forcerait une signature instable. L'objet options est extensible sans breaking change.

**Alternatives rejetées :** Séisme one-shot (pas assez visuel) ; magnétisme appliqué avant `stepPhysics` (la friction annulait la force sur les boules lentes) ; preview courbe simulée frame par frame (interdit par CLAUDE.md — recalcul de physique dans React).

---

## 2026-07-01 — Refonte du modèle de friction physique

**Décision :** La friction reste multiplicative (`v *= FRICTION^(dt*60)`, décroissance exponentielle). `FRICTION` passe de `0.984` à `0.978` pour un arrêt ~30% plus rapide (~4s au lieu de ~5.5s). Un plafond `MAX_BALL_SPEED = 8.0` est appliqué après chaque rebond sur les bandes pour empêcher l'emballement des Bandes Rebondissantes.

**Pourquoi multiplicatif et non constant :** la décélération constante (modèle de Coulomb pur) est linéaire — la boule perd la même quantité de vitesse par frame quelle que soit sa vitesse. Le modèle multiplicatif est proportionnel à la vitesse courante : la boule décélère vite quand elle va vite, et progressivement quand elle est lente. C'est ce qui donne l'impression de réalisme sur un tapis de billard.

**Plafond MAX_BALL_SPEED :** sans ce plafond, les Bandes Rebondissantes peuvent créer un cycle stable où `v_avant * restitution * friction_factor >= v_avant`. Avec `BOUNCY_WALLS_RESTITUTION = 1.3` et le plafond à `8.0`, le cycle converge toujours vers 0 en ≤ 6s.

**Alternatives rejetées :** Décélération constante (essayée, perçue comme non-progressive) ; friction `0.984` sans plafond (trop lente + softlock bandes) ; timeout de tir global (plus complexe, moins ciblé).

---

## 2026-07-01 — Rééquilibrage des coûts des power-ups

**Décision :** Grille de coût révisée en 5 paliers (1–6 pièces) selon l'impact gameplay.

| Palier | Coût | Power-ups |
|---|---|---|
| S | 6 | Clone (4 blanches supplémentaires) |
| A | 5 | Triangle (3 blanches en éventail) |
| B | 4 | Triple Tir, Tir Explosif |
| C | 3 | Clonage au contact, Boule Magnétique |
| D | 2 | Tir Courbé G/D, Coins Verrouillés, Séisme, Bandes Rebondissantes |
| E | 1 | Milieux Verrouillés, Tapis Glissant, Tapis Collant |

**Critères :** contrôle du résultat (fort = cher), résilience au chaos (Séisme peu fiable = pas cher), impact réduit après ajustement physique (Bandes Rebondissantes ramenées à 1.3×).

**Alternatives rejetées :** coûts uniformes (rend tous les bonus équivalents, détruit la décision d'achat) ; coût variable selon le score (complexité inutile à ce stade).
