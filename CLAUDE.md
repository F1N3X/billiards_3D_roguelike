# [billiards_3D_roguelike] — Notes pour Claude

## Pitch
Billard 3D Roguelike est un jeu de billard en 3D où le joueur doit vider la table en empochant les boules. Le projet met l'accent sur une physique crédible, des contrôles simples et une boucle de jeu extensible vers des mécaniques roguelike.

## Stack technique
- **Langage** : [TypeScript]
- **Framework front** : [React]
- **Rendu 3D** : [Three.js / React Three Fiber]
- **Physique** : [stepPhysics]
- **Framework back** : [Nest.js]
- **Base de donnée** : [MongoDB]
- **Styling** : [CSS modules]
- **Lint** : [ESLint]
- **Tests** : [Vitest]

## Règles métier critiques
1. Une boule empochée ne doit jamais réapparaître sur la table.
2. Les collisions entre boules doivent toujours être résolues par le moteur physique, jamais "à la main".
3. Une seule boule blanche existe pendant une partie dans le mode de base.
4. La simulation physique est la source de vérité des positions des objets.
5. L'état du jeu (victoire, défaite, tour terminé...) est déterminé uniquement par l'état de la partie, jamais par l'UI.

## Conventions de code
- TypeScript strict.
- Pas de any.
- Nommage en camelCase pour les variables.
- Nommage des fichiers en kebab-case.
- Un composant React = une responsabilité.
- Si un fichier dépasse ~250 lignes, proposer un découpage.
- Les composants React ne doivent contenir que de l'affichage et de la gestion d'interactions.
- Toute erreur doit être loggée.
- Si tu hésites, demande.

## Organisation du code
- Les composants React affichent uniquement la scène.
- La logique de jeu reste indépendante des composants.
- La physique est centralisée et ne doit pas être dupliquée.
- Les constantes de gameplay sont regroupées dans un fichier dédié.

## À privilégier
- Réutiliser les fonctions existantes.
- Étendre les systèmes existants plutôt qu'en créer de nouveaux.
- Préserver les performances (éviter les rerenders inutiles).

## À éviter
- ❌ Recalculer la physique dans React.
- ❌ Modifier directement la position des objets sans passer par le moteur physique.
- ❌ Mélanger logique métier et composants d'affichage.
- ❌ Hardcoder les constantes de gameplay.


## Scripts déterministes à appeler

Pour les calculs et règles métier, **utilise ces fonctions** :

- `frontend/src/physics/step-physics.ts` → simulation physique
- `frontend/src/logic/score.ts` → calcul du score
- `frontend/src/scene/create-table.ts` → création de la table
- `frontend/src/scene/create-room.ts` → création de la salle
- `frontend/src/scene/create-balls.ts` → création et placement des boules
- `frontend/src/scene/create-lamps.ts` → création et placement des lampes
- `frontend/src/scene/create-cue.ts` → création et placement de la queue
- `frontend/src/config/*.ts` → constantes de gameplay
- `frontend/src/types/*.ts` → types partagés

### Scripts utilitaires (`scripts/` — `npx tsx scripts/<nom>.ts`)

| Script | Usage |
|---|---|
| `validate-config.ts` | Vérifie la cohérence des constantes de `constants.ts` (physique, géométrie, score). Exit 0/1. |
| `score-table.ts` | Affiche la table des scores pour tous les scénarios de coup et les bonus de victoire. |
| `check-rack.ts` | Valide les positions initiales des boules (triangle, pas de chevauchement, pas dans les poches). Exit 0/1. |
| `simulate-trajectory.ts` | Simule la trajectoire d'une boule blanche. Args : `[angle_deg] [power_mult]`. |
| `audit-powerups.ts` | Audite les power-ups (champs requis, cohérence registry ↔ type ↔ fichiers). Exit 0/1. |
| `seed-db.ts` | Seede la base avec des utilisateurs et parties de test. Nécessite le backend. |


## Gates qualité

Tout code produit ou modifié doit passer ces vérifications avant d'être considéré comme terminé.

### Linting & formatage
- **ESLint** : aucune erreur. `npm run lint` doit sortir avec exit 0.
- **Prettier** : formatage appliqué. Utiliser `npx prettier --write <fichier>` si besoin.

### TypeScript
- ❌ **Interdit** : `any` explicite ou implicite. Utiliser des types précis ou `unknown` + assertion.
- ❌ **Interdit** : imports inutilisés. ESLint rule `no-unused-vars` / `@typescript-eslint/no-unused-vars` doit être satisfaite.
- ❌ **Interdit** : `// @ts-ignore` ou `// @ts-expect-error` sans commentaire explicatif.

### Gestion des erreurs
- ❌ **Interdit** : `try { ... } catch (_e) {}` ou tout catch qui avale silencieusement.
- Toute erreur capturée doit être loggée (`console.error`) ou re-throwée.
- Pas de `catch (e) { /* silent */ }`, pas de `catch: pass` equivalent JS/TS.

### Tests
- Tout nouveau fichier de logique (`logic/`, `physics/`, `config/`) doit avoir un fichier de test Vitest associé (`*.test.ts`).
- Les tests doivent passer : `npm run test` exit 0.
- Pas de `it.skip` ou `test.skip` sans justification dans le commit.

### Taille des fichiers
- ❌ **Interdit** : fichier dépassant 250 lignes sans découpage proposé.
- Si un fichier dépasse 250 lignes après modification, proposer immédiatement un découpage en sous-modules.

## Anti-patterns d'ingénierie
1. ❌ **Big bang refacto** : pas de feature flag, pas de coexistence. Remplace, nettoie, commit.
2. ❌ **No stub / no TODO** : pas de `return null; // TODO`. Si commité, ça MARCHE.
3. ❌ **No silent fail** : pas de `try/catch` qui avale. Log ou re-throw.
4. ❌ **No revert** : corrige forward, jamais backward.
5. ❌ **No god file** : >250 lignes = découpe.
6. ❌ **No magic number** : valeurs business → `src/config/`.
7. ❌ **No vibe-prompt** : prompt précis ou pas de prompt.

## Commandes utiles
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run preview`

## Fichiers de référence
- `README.md` → présentation utilisateur du projet
- `DECISIONS.md` → suivis des explications des raisons des ajouts des features
- `memory/` → fichiers de mémoire et de contexte des différents apsects du projet
- `scripts/` → fichiers de scripts déterministes
- `.claude/skills/` → fichiers de skills à utiliser dans les cas concernés ou globaux


## Documentation

Lorsqu'une modification change :

- une décision d'architecture,
- une règle métier,
- une convention importante,
- une mécanique de gameplay,
- ou la façon dont le projet est organisé,

mettre à jour `DECISIONS.md`.

Chaque entrée doit expliquer :

- la décision prise ;
- pourquoi elle a été prise ;
- les alternatives rejetées (si pertinent).

Ensuite, met à jour `README.md` pour documenter l'intégralité du projet :
- comment lancer
- architecture
- utilisation

## Workflow

Avant toute modification :

1. Comprendre les modules existants.
2. Réutiliser les systèmes existants.
3. Ne jamais dupliquer une logique déjà présente.
4. Si une modification change une décision d'architecture ou de gameplay, mettre à jour `DECISIONS.md` et `README.md`.


## Memory

Tes fichiers de mémoire se trouvent dans le dossier `./memory`.
Sers toi de ces dossier pour récupérer le contexte du projet.
Met les à jour à chaque modification afin de garder le contexte.