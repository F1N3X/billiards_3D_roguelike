# Auditer la dette technique du projet

Déclencher quand : "audit dette", "dette technique", "tech debt", "qualité du code", "état du code".

Produit un rapport structuré dans le chat, puis propose les corrections prioritaires.

---

## Étape 1 — Lint & formatage

```bash
cd frontend && npm run lint 2>&1 | tail -30
```

Compter : erreurs ESLint, warnings. Noter les fichiers concernés.

---

## Étape 2 — Détection des `any` explicites

```bash
grep -rn ": any" frontend/src --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v node_modules
```

```bash
grep -rn "as any" frontend/src --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v node_modules
```

Lister chaque occurrence : fichier, ligne, contexte.

---

## Étape 3 — Imports inutilisés

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "is declared but"
```

Compléter avec :

```bash
grep -rn "^import" frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Croiser avec le résultat ESLint de l'étape 1 (rule `no-unused-vars`).

---

## Étape 4 — Catches silencieux

```bash
grep -rn "catch" frontend/src --include="*.ts" --include="*.tsx" -A 2 | grep -v node_modules
```

Identifier les patterns :
- `catch (_e) {}` — bloc vide
- `catch (e) { /* ... */ }` — commentaire sans log
- `catch (e) { return; }` — retour silencieux sans log

---

## Étape 5 — God files (>250 lignes)

```bash
find frontend/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v "\.test\." | xargs wc -l | sort -rn | head -20
```

Signaler tout fichier dépassant 250 lignes avec son chemin et nombre de lignes.

---

## Étape 6 — TODOs / FIXMEs

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" frontend/src --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Lister chaque occurrence avec son fichier et ligne.

---

## Étape 7 — Tests manquants

```bash
find frontend/src/logic frontend/src/physics frontend/src/config -name "*.ts" | grep -v "\.test\." | grep -v node_modules
```

```bash
find frontend/src -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules
```

Pour chaque fichier de logique sans `.test.ts` correspondant, le signaler.

---

## Étape 8 — Magic numbers hors config

```bash
grep -rn "[^a-zA-Z0-9_][0-9]\{2,\}[^a-zA-Z0-9_]" frontend/src --include="*.ts" --include="*.tsx" | grep -v "frontend/src/config" | grep -v "\.test\." | grep -v node_modules | head -30
```

Signaler les valeurs numériques hardcodées hors des fichiers `config/`.

---

## Étape 9 — Rapport final

Rédiger un rapport structuré :

```
## Rapport dette technique — YYYY-MM-DD

### Résumé
| Catégorie              | Occurrences | Sévérité |
|------------------------|-------------|----------|
| Erreurs ESLint         | N           | 🔴 haute |
| Types `any`            | N           | 🔴 haute |
| Catches silencieux     | N           | 🔴 haute |
| Imports inutilisés     | N           | 🟠 moyenne |
| God files (>250 l.)    | N           | 🟠 moyenne |
| Tests manquants        | N           | 🟠 moyenne |
| TODOs / FIXMEs         | N           | 🟡 faible |
| Magic numbers          | N           | 🟡 faible |

### Détail par catégorie
{liste des occurrences avec fichier:ligne}

### Priorités suggérées
1. {item le plus critique}
2. ...
```

---

## Ce qu'on ne fait PAS

- ❌ Corriger automatiquement sans validation de l'utilisateur
- ❌ Modifier plusieurs fichiers en une seule passe sans accord
- ❌ Ignorer les fichiers de test dans le décompte (ils ont leurs propres règles)
- ❌ Signaler les faux positifs des magic numbers dans les fichiers `config/`
