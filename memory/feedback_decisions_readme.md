---
name: feedback-decisions-readme
description: Toujours mettre à jour DECISIONS.md et README.md après un changement d'architecture, sans attendre que l'utilisateur le demande
metadata:
  type: feedback
---

Toujours mettre à jour `DECISIONS.md` et `README.md` immédiatement après tout changement d'architecture, de règle métier, d'organisation du projet ou de mécanique de gameplay — sans attendre que l'utilisateur le demande.

**Why:** C'est une règle explicite du CLAUDE.md du projet. L'utilisateur a dû corriger l'oubli après la dockerisation.

**How to apply:** À la fin de chaque tâche qui touche à l'architecture (nouveau service, Docker, split monorepo, choix de lib…), mettre à jour les deux fichiers dans le même élan que les fichiers de code.
