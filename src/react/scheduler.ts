// ============================================================================
// Scheduler: coordina el trabajo de render de cada root, con batching por
// microtask y un manejo de errores que sube hasta el Error Boundary más cercano.
// Soporta múltiples roots independientes (cada uno con su propio estado).
// ============================================================================

import { R, contextStack } from './internals.js';
import {
  commitRoot,
  createWorkInProgress,
  isErrorBoundary,
  performUnitOfWork,
} from './reconciler.js';
import type { ComponentInstance, Fiber, RootStateContainer } from './types.js';

const pendingRoots = new Set<RootStateContainer>();
let flushScheduled = false;
let batchDepth = 0;

/** Llamado por los hooks/clases cuando hay una actualización de estado. */
export function scheduleUpdate(fiber: Fiber): void {
  const root = fiber.root;
  if (!root) return;
  root.dirtyFibers.add(fiber);
  pendingRoots.add(root);
  ensureFlush();
}

/** Registra un root con trabajo pendiente (usado por el render inicial). */
export function enqueueRoot(root: RootStateContainer): void {
  pendingRoots.add(root);
  ensureFlush();
}

function ensureFlush(): void {
  if (batchDepth > 0) return; // dentro de flushSync: se drena al salir
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    flushAll();
  });
}

/** Ejecuta un callback y drena TODO el trabajo pendiente de forma síncrona. */
export function flushSync<T>(fn?: () => T): T | undefined {
  batchDepth++;
  let result: T | undefined;
  try {
    if (fn) result = fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) flushAll();
  }
  return result;
}

function flushAll(): void {
  // Copiamos porque performRootWork puede re-agendar (efectos con setState).
  const roots = Array.from(pendingRoots);
  pendingRoots.clear();
  for (const root of roots) performRootWork(root);
}

/** Prepara un nuevo work-in-progress a partir del árbol comprometido. */
export function prepareFreshWip(root: RootStateContainer): void {
  const current = root.currentRoot;
  if (!current) return;
  root.wipRoot = createWorkInProgress(current, current.props);
  root.wipRoot.dom = root.container;
  root.wipRoot.root = root;
  root.deletions = [];
  root.pendingEffects = [];
  contextStack.length = 0;
  R.forceRenderDepth = 0;
  root.nextUnitOfWork = root.wipRoot;
}

function performRootWork(root: RootStateContainer): void {
  if (!root.wipRoot) {
    if (!root.currentRoot) return;
    prepareFreshWip(root);
  }
  R.activeRoot = root;
  workLoopSync(root);
  commitRoot(root);
  root.dirtyFibers.clear();
  R.activeRoot = null;
}

function workLoopSync(root: RootStateContainer): void {
  while (root.nextUnitOfWork) {
    try {
      root.nextUnitOfWork = performUnitOfWork(root.nextUnitOfWork);
    } catch (error) {
      handleRenderError(root, error);
    }
  }
}

/** Busca el Error Boundary más cercano hacia arriba y le pasa el error. */
function handleRenderError(root: RootStateContainer, error: unknown): void {
  const failing = root.nextUnitOfWork;
  let boundary: Fiber | null = failing ? failing.parent : null;
  while (boundary && !(boundary.stateNode && isErrorBoundary(boundary))) {
    boundary = boundary.parent;
  }
  if (!boundary) {
    R.activeRoot = null;
    throw error; // sin boundary: el error se propaga
  }

  // Restaurar la pila de contextos al punto en que empezó el boundary.
  contextStack.length = boundary.ctxDepth;
  R.forceRenderDepth = boundary.forceDepth;

  const instance = boundary.stateNode as ComponentInstance;
  const Ctor = boundary.type as {
    getDerivedStateFromError?: (e: unknown) => object;
  };
  const derived =
    typeof Ctor.getDerivedStateFromError === 'function'
      ? Ctor.getDerivedStateFromError(error)
      : {};
  instance.state = { ...instance.state, ...(derived as Record<string, unknown>) };
  if (typeof instance.componentDidCatch === 'function') {
    instance.componentDidCatch(error, { componentStack: '' });
  }

  // Re-renderizar SOLO el subárbol del boundary con el estado de fallback.
  boundary.child = null;
  boundary.hasPendingUpdate = true;
  root.nextUnitOfWork = boundary;
}
