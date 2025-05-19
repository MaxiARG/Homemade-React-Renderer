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
- `useState`
- `useEffect`
- _More coming soon..._

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

> _Inspired by how React prioritizes performance and user experience through its internal mechanisms._
