function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// ============================================================================
// Scheduler: coordina el trabajo de render de cada root, con batching por
// microtask y un manejo de errores que sube hasta el Error Boundary más cercano.
// Soporta múltiples roots independientes (cada uno con su propio estado).
// ============================================================================

import { R, contextStack } from './internals.js';
import { commitRoot, createWorkInProgress, isErrorBoundary, performUnitOfWork } from './reconciler.js';
var pendingRoots = new Set();
var flushScheduled = false;
var batchDepth = 0;

/** Llamado por los hooks/clases cuando hay una actualización de estado. */
export function scheduleUpdate(fiber) {
  var root = fiber.root;
  if (!root) return;
  root.dirtyFibers.add(fiber);
  pendingRoots.add(root);
  ensureFlush();
}

/** Registra un root con trabajo pendiente (usado por el render inicial). */
export function enqueueRoot(root) {
  pendingRoots.add(root);
  ensureFlush();
}
function ensureFlush() {
  if (batchDepth > 0) return; // dentro de flushSync: se drena al salir
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(function () {
    flushScheduled = false;
    flushAll();
  });
}

/** Ejecuta un callback y drena TODO el trabajo pendiente de forma síncrona. */
export function flushSync(fn) {
  batchDepth++;
  var result;
  try {
    if (fn) result = fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) flushAll();
  }
  return result;
}
function flushAll() {
  // Copiamos porque performRootWork puede re-agendar (efectos con setState).
  var roots = Array.from(pendingRoots);
  pendingRoots.clear();
  for (var _i = 0, _roots = roots; _i < _roots.length; _i++) {
    var root = _roots[_i];
    performRootWork(root);
  }
}

/** Prepara un nuevo work-in-progress a partir del árbol comprometido. */
export function prepareFreshWip(root) {
  var current = root.currentRoot;
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
function performRootWork(root) {
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
function workLoopSync(root) {
  while (root.nextUnitOfWork) {
    try {
      root.nextUnitOfWork = performUnitOfWork(root.nextUnitOfWork);
    } catch (error) {
      handleRenderError(root, error);
    }
  }
}

/** Busca el Error Boundary más cercano hacia arriba y le pasa el error. */
function handleRenderError(root, error) {
  var failing = root.nextUnitOfWork;
  var boundary = failing ? failing.parent : null;
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
  var instance = boundary.stateNode;
  var Ctor = boundary.type;
  var derived = typeof Ctor.getDerivedStateFromError === 'function' ? Ctor.getDerivedStateFromError(error) : {};
  instance.state = _objectSpread(_objectSpread({}, instance.state), derived);
  if (typeof instance.componentDidCatch === 'function') {
    instance.componentDidCatch(error, {
      componentStack: ''
    });
  }

  // Re-renderizar SOLO el subárbol del boundary con el estado de fallback.
  boundary.child = null;
  boundary.hasPendingUpdate = true;
  root.nextUnitOfWork = boundary;
}