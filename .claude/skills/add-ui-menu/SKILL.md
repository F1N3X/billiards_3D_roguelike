# Créer un nouveau menu / écran UI

## 1. Composant React — `frontend/src/ui/MonMenu.tsx`

Un composant = une responsabilité. Il n'affiche que, il ne calcule pas.

```typescript
interface Props {
  onAction: () => void  // callbacks vers App.tsx, jamais de logique interne
}

export function MonMenu({ onAction }: Props) {
  return <div className={styles.container}>...</div>
}
```

## 2. CSS Module — `frontend/src/ui/MonMenu.module.css`

Toujours un fichier CSS module dédié. Pas de style inline, pas de classe globale.

## 3. Routing — `frontend/src/App.tsx`

Si c'est une nouvelle page navigable :

```typescript
type Page = 'menu' | 'login' | 'account' | 'game' | 'rumble' | 'mon-menu'
```

Ajouter le rendu conditionnel dans `AppRouter` et le bouton d'entrée dans `MainMenu.tsx`.

Si c'est un overlay (HUD, modal) : le monter directement dans le Screen parent, pas dans AppRouter.

## 4. Test — `frontend/src/ui/MonMenu.test.tsx`

Tester le rendu et les interactions utilisateur (clicks sur les boutons, callbacks appelés).

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MonMenu } from './MonMenu'

it('appelle onAction au clic', () => {
  const onAction = vi.fn()
  render(<MonMenu onAction={onAction} />)
  fireEvent.click(screen.getByRole('button', { name: /action/i }))
  expect(onAction).toHaveBeenCalled()
})
```

## Ce qu'on ne fait PAS

- ❌ Mettre de la logique métier dans le composant (calcul de score, état de jeu)
- ❌ Accéder à l'état global depuis le menu — tout passe par les props
- ❌ Utiliser du style inline ou des classes CSS globales
- ❌ Créer un nouveau système de routing (toujours le `page` state de App.tsx)
