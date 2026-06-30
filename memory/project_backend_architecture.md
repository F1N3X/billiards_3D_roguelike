---
name: project-backend-architecture
description: Architecture backend NestJS + MongoDB native driver, structure des modules, URI cluster Atlas
metadata:
  type: project
---

Backend NestJS dans `backend/`, driver MongoDB natif (pas Mongoose). Connexion via `DatabaseModule` (token `MONGO_CLIENT` / `MONGO_DB`), URI dans `.env` (MONGODB_URI).

**Modules créés :**
- `UsersModule` → CRUD `/users` (pseudo, email, passwordHash bcrypt). Le mot de passe n'est jamais renvoyé en réponse.
- `GameHistoryModule` → CRUD `/game-history` (userId ObjectId, gameMode, score, shots, playedAt). Route extra : `GET /game-history/user/:userId`.

**Why:** User a un cluster Atlas MongoDB, déjà `mongodb` installé. Mongoose n'a pas été ajouté pour rester léger.

**How to apply:** Pour ajouter une nouvelle collection, créer un module NestJS similaire et injecter `@Inject(MONGO_DB) private readonly db: Db`.
