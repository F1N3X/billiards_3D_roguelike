---
name: project-backend-architecture
description: Architecture backend NestJS + MongoDB native driver, structure des modules, URI cluster Atlas
metadata:
  type: project
---

Backend NestJS dans `backend/`, driver MongoDB natif (pas Mongoose). Connexion via `DatabaseModule` (token `MONGO_CLIENT` / `MONGO_DB`), URI dans `.env` (MONGODB_URI).

**Modules créés :**
- `UsersModule` → CRUD `/users` (pseudo, email, passwordHash bcrypt). Le mot de passe n'est jamais renvoyé en réponse.
- `GameHistoryModule` → CRUD `/game-history` (userId ObjectId, gameMode, score, shots, playedAt). Route extra : `GET /game-history/user/:userId`. `POST /game-history` exige un `sessionId` valide.
- `AuthModule` → JWT signé HS256 via `@nestjs/jwt`. `JwtAuthGuard` protège les routes mutantes. Secret dans `.env` (`JWT_SECRET`, 7j d'expiration). `POST /users/login` retourne `{ user, token }`.
- `GameSessionsModule` → `POST /game-sessions/start` (JWT) crée une session (TTL 2h, single-use) et retourne `{ sessionId }`. `GameSessionsService.consumeAndValidate()` vérifie et marque la session utilisée avant toute sauvegarde de score.

**Routes protégées par JWT :** `PATCH /users/:id`, `DELETE /users/:id`, `POST /game-history`, `DELETE /game-history/:id`, `POST /game-sessions/start`.

**Plafond de score (dans `GameSessionsService`) :** classic = 9 000 pts. Rumble : pas de plafond — `clone_on_contact` produit une croissance exponentielle (15×2ⁿ boules après n tirs), aucun plafond fini n'est défendable. La protection Rumble repose sur le token de session seul.

**Frontend :** `AuthUser` contient le champ `token`. `api.ts` envoie `Authorization: Bearer <token>` sur les routes protégées. Le token est stocké en `localStorage` via `auth-context.tsx`.

**Why:** User a un cluster Atlas MongoDB, déjà `mongodb` installé. Mongoose n'a pas été ajouté pour rester léger.

**How to apply:** Pour ajouter une nouvelle collection, créer un module NestJS similaire et injecter `@Inject(MONGO_DB) private readonly db: Db`. Pour protéger une route, ajouter `@UseGuards(JwtAuthGuard)` et importer `AuthModule` dans le module parent.
