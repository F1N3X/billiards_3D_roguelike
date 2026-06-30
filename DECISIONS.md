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
