# [billiards_3D_roguelike] — Notes pour Claude

## Pitch
Billard 3D Roguelike est un jeu de billard en 3D où le joueur doit vider la table en empochant les boules. Le projet met l'accent sur une physique crédible, des contrôles simples et une boucle de jeu extensible vers des mécaniques roguelike.

## Stack technique
- **Langage** : [TypeScript]
- **Framework front** : [React]
- **Rendu 3D** : [Three.js / React Three Fiber]
- **Physique** : [stepPhysics]
- **Framework back** : Nest.js
- **Styling** : [CSS modules]
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


## Anti-patterns d'ingénierie
1. ❌ **Big bang refacto** : pas de feature flag, pas de coexistence. Remplace, nettoie, commit.
2. ❌ **No stub / no TODO** : pas de `return null; // TODO`. Si commité, ça MARCHE.
3. ❌ **No silent fail** : pas de `try/catch` qui avale. Log ou re-throw.
4. ❌ **No revert** : corrige forward, jamais backward.
5. ❌ **No god file** : >250 lignes = découpe.
6. ❌ **No magic number** : valeurs business → `src/config/`.
7. ❌ **No vibe-prompt** : prompt précis ou pas de prompt.

## Commandes utiles
npm install
npm run dev
npm run build
npm run test
npm run lint
npm run preview

## ## Fichiers de référence
- `README.md` → présentation utilisateur du projet
- `DECISIONS.md` → suivis des explications des raisons des ajouts des features


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


## Workflow

Avant toute modification :

1. Comprendre les modules existants.
2. Réutiliser les systèmes existants.
3. Ne jamais dupliquer une logique déjà présente.
4. Si une modification change une décision d'architecture ou de gameplay, mettre à jour `DECISIONS.md` et `README.md`.