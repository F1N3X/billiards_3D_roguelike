# Ajouter un nouveau power-up

Quand on ajoute un power-up :

1. créer le type dans `src/game/powerups/types.ts`
2. implémenter son comportement dans `src/game/powerups/`
3. enregistrer le power-up dans `PowerUpRegistry`
4. ajouter son icône
5. écrire un test Vitest

Ne jamais modifier directement le Player.
Toujours passer par le système de Buffs.