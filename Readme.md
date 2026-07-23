# React Engine Study

> This project is a study of how **React works internally**, inspired by its architecture and execution model.

---

## 📦 Tooling Integrated

Just like React, this project integrates supporting tools:

1. **Babel** — Transpiles JSX/TSX to JavaScript, allowing you to write HTML-like tags.
2. **TypeScript** — Provides type safety and better development experience.

---

## ⚙️ Core Concepts Demonstrated

### 1. Transpilation
- **JSX/TSX to JavaScript**: Enables writing React tags and inserting them into the DOM.

### 2. Renderer
- **React-like Renderer**: Builds a tree-like data structure representing React nodes.

### 3. Scheduler
- **Idle Time Execution**: Runs tasks while the browser is idle to prevent blocking the UI.

### 4. Fiber Data Structure
- Models:
  - **Nodes**, **parents**, **children**, **siblings**
  - **Current** and **previous** states
- Powers:
  - **Reconciliation** when state changes

### 5. Hooks (Implemented)
- `useState`, `useReducer`, `useRef`, `useMemo`, `useCallback`, `useEffect`, `useContext`

### 6. Inline Style Support
- Supports passing style objects as props.

### 7. Children Flattening
- Example:
  ```jsx
  {myListOfUsers.map(user => <div>{user.name}</div>)}
  ```

---

## 🛠️ Debugging React-like Execution

When debugging a real React app, you'll encounter the following **call stack**:

- `workLoop`
- `performUnitOfWork`
- `updateFunctionComponent`

---

## ⚠️ Differences from Real React

- **Render Phase**:  
  - _This project walks the whole tree._  
    React uses heuristics to skip subtrees where nothing changed.

- **Commit Phase**:  
  - _This project walks the whole tree._  
    React keeps a linked list of fibers with effects and visits only those.

- **Fiber Reuse**:  
  - _This project recreates fibers every time._  
    React recycles fibers from previous trees.

- **Update Handling**:  
  - _This project restarts from scratch when an update comes in._  
    React uses expiration timestamps to prioritize updates.

---

## 🚧 Roadmap / TODO

- **Reconciliation by Key**
  - Build a map of old fibers by key.
  - Reconcile using keys first.
  - Fallback to type and position matching if no key is present.

---

## 🚀 Motor v2 (reescritura modular)

El motor se reescribió de un archivo monolítico a un núcleo **modular y tipado** en
[`src/react/`](./src/react/), con estado encapsulado por-root. Novedades:

- **`createRoot(container)`** — múltiples roots independientes (además de `render` legacy).
- **Reconciliación por `key`** con detección de movimientos (reordenar preserva DOM y estado).
- **Doble buffer** (`createWorkInProgress` reutiliza el `alternate`).
- **Bailout** de subárboles sin cambios + **`memo(Component)`**.
- **Batching** por microtask + **`flushSync`**.
- **Context** (`createContext` / `useContext`), **`Fragment`** y **Error Boundaries** (`Component`).
- **Tipado completo** (sin `any` en el núcleo).

### Scripts

```bash
npm install      # instala dependencias (incluye jest + jsdom)
npm test         # corre la batería de tests (19 tests)
npm run build    # compila src/ -> public/
npm start        # build + servidor estático (npx serve public)
```

## 📚 Documentación

Se incluye una documentación completa (36 archivos HTML) en la carpeta [`Documentacion/`](./Documentacion/).
Abrí [`Documentacion/01-portada.html`](./Documentacion/01-portada.html) en el navegador para
recorrer, capítulo por capítulo, el funcionamiento interno del proyecto: fundamentos (01–20),
arquitectura y features del motor v2 (21–29) y el ciclo de vida de cada hook (30–36).

## 🐛 Correcciones aplicadas

Durante el análisis se corrigieron cuatro bugs reales (ver capítulo 19 de la documentación):

1. `createElement` ahora ignora hijos `null`/`undefined`/booleanos (permite `{cond && <X/>}`).
2. `updateDom` limpia correctamente estilos pasados como *string* (no solo objetos).
3. `useEffect` protege la comparación de dependencias cuando el hook previo no tenía `deps`.
4. `index.html` carga `./App.js` con la mayúscula correcta que genera el build de Babel.

---

> _Inspired by how React prioritizes performance and user experience through its internal mechanisms._
