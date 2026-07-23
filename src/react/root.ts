// ============================================================================
// createRoot / render: puntos de entrada. Cada root es independiente y encapsula
// su propio estado (antes eran variables globales de módulo).
// ============================================================================

import { R, contextStack } from './internals.js';
import { createHostRootFiber, createWorkInProgress } from './reconciler.js';
import { enqueueRoot, flushSync } from './scheduler.js';
import type { DomNode, ReactElement, RootStateContainer } from './types.js';

export interface ReactRoot {
  render(element: ReactElement): void;
  unmount(): void;
  /** Acceso al estado interno (para tests/depuración). */
  _internal: RootStateContainer;
}

function createRootState(container: DomNode): RootStateContainer {
  return {
    container,
    currentRoot: null,
    wipRoot: null,
    nextUnitOfWork: null,
    deletions: [],
    pendingEffects: [],
    dirtyFibers: new Set(),
  };
}

/** Prepara el work-in-progress del `element` dentro de este root. */
function updateContainer(root: RootStateContainer, element: ReactElement): void {
  if (root.currentRoot) {
    // Re-render del mismo root: doble buffer sobre el árbol comprometido.
    root.wipRoot = createWorkInProgress(root.currentRoot, { children: [element] });
  } else {
    // Primer montaje.
    root.wipRoot = createHostRootFiber(root.container, { children: [element] });
  }
  root.wipRoot.dom = root.container;
  root.wipRoot.root = root;
  root.deletions = [];
  root.pendingEffects = [];
  contextStack.length = 0;
  R.forceRenderDepth = 0;
  root.nextUnitOfWork = root.wipRoot;
}

/**
 * Crea un root sobre un contenedor del DOM. Se pueden crear varios roots
 * independientes en la misma página; cada uno tiene su propio ciclo de render.
 */
export function createRoot(container: DomNode): ReactRoot {
  const state = createRootState(container);
  return {
    render(element: ReactElement): void {
      // El render inicial se drena de forma síncrona (resultado determinista).
      flushSync(() => {
        updateContainer(state, element);
        enqueueRoot(state);
      });
    },
    unmount(): void {
      if (state.container instanceof HTMLElement) state.container.innerHTML = '';
      state.currentRoot = null;
      state.wipRoot = null;
      state.nextUnitOfWork = null;
    },
    _internal: state,
  };
}

/**
 * API legacy estilo `ReactDOM.render(element, container)`. Internamente crea un
 * root. Se conserva por compatibilidad con los ejemplos existentes.
 */
export function render(element: ReactElement, container: DomNode): ReactRoot {
  const root = createRoot(container);
  root.render(element);
  return root;
}
