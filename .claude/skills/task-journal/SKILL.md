# Clôturer une session de travail

Écrit un récap dans `docs/journal/YYYY-MM.md` à la racine du projet.

Déclencher quand : fin de conversation, "clôture", "note ce qu'on a fait", avant un /clear.

---

## Étape 1 — Déterminer la date

Utiliser la date du **dernier message substantiel de la conversation** — jamais la date système.
Si ambigu, demander à l'utilisateur.

## Étape 2 — Rédiger le récap (dans le chat d'abord)

- Ton : product manager, pas développeur
- Longueur : 3 à 8 phrases
- **INTERDIT** : noms de fichiers, noms de fonctions, extraits de code
- **OBLIGATOIRE** : mentionner si des tests ont été écrits, si un bug en prod a été corrigé, si une mécanique de jeu a changé

Exemples de formulation :
- ✅ "La mécanique d'économie du mode Rumble a été corrigée : les pièces infinies en production ont été supprimées."
- ❌ "J'ai modifié `.env` et `IS_DEV` dans `power-ups.ts`."

## Étape 3 — Écrire dans le fichier

Fichier : `docs/journal/YYYY-MM.md` (créer avec `# Journal — YYYY-MM` si inexistant).

Format :
```
# Journal — YYYY-MM

---

## YYYY-MM-DD (jour)

### Titre fonctionnel court

{Récap identique à l'étape 2, mot pour mot.}
```

- Jours en ordre **ante-chronologique** (le plus récent en haut)
- Si le jour existe déjà : ajouter l'entrée en dessous des existantes
