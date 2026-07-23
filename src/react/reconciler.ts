// ============================================================================
// Reconciliador: render phase (beginWork/completeWork), diffing con keys,
// doble buffer (createWorkInProgress), bailout, y commit phase.
// ============================================================================

import { createDom, updateDom } from './dom.js';
import { Fragment, TEXT_ELEMENT } from './types.js';
import { R, contextStack } from './internals.js';
import type {
  ComponentInstance,
  DomNode,
  EffectHook,
  Fiber,
  Key,
  MemoComponent,
  Props,
  ReactContext,
  ReactElement,
  RootStateContainer,
} from './types.js';

// ----------------------------------------------------------------------------
// Clasificación de tipos
// ----------------------------------------------------------------------------

function isHostType(fiber: Fiber): boolean {
  return fiber.type === TEXT_ELEMENT || typeof fiber.type === 'string';
}
function isHostParent(fiber: Fiber): boolean {
  return isHostType(fiber) || fiber.type === 'ROOT';
}
export function isClassComponent(type: unknown): boolean {
  return (
    typeof type === 'function' &&
    (type as { isReactComponent?: boolean }).isReactComponent === true
  );
}
function isMemo(type: unknown): type is MemoComponent {
  return (
    typeof type === 'object' &&
    type !== null &&
    (type as MemoComponent).$$typeof === 'react.memo'
  );
}
function isProvider(type: unknown): type is { _context: ReactContext<unknown> } {
  return typeof type === 'function' && '_context' in (type as object);
}
export function isErrorBoundary(fiber: Fiber): boolean {
  if (!isClassComponent(fiber.type)) return false;
  const t = fiber.type as {
    getDerivedStateFromError?: unknown;
    prototype?: { componentDidCatch?: unknown };
  };
  return (
    typeof t.getDerivedStateFromError === 'function' ||
    typeof t.prototype?.componentDidCatch === 'function'
  );
}

// ----------------------------------------------------------------------------
// Construcción de fibers y doble buffer
// ----------------------------------------------------------------------------

function newFiber(type: Fiber['type'], props: Props, key: Key): Fiber {
  return {
    type,
    props,
    key,
    dom: null,
    parent: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: 'NONE',
    index: 0,
    moved: false,
    hooks: null,
    stateNode: null,
    hasPendingUpdate: false,
    providerContext: null,
    providerForced: false,
    ctxDepth: 0,
    forceDepth: 0,
    root: null,
  };
}

/** Crea el fiber raíz (host root) asociado al contenedor del DOM. */
export function createHostRootFiber(container: DomNode, props: Props): Fiber {
  const fiber = newFiber('ROOT', props, null);
  fiber.dom = container;
  return fiber;
}

export function createFiberFromElement(element: ReactElement): Fiber {
  return newFiber(element.type, element.props, element.key);
}

/**
 * Doble buffer: reutiliza el fiber `alternate` de `current` como
 * work-in-progress en vez de crear siempre uno nuevo (reduce presión de GC).
 */
export function createWorkInProgress(current: Fiber, pendingProps: Props): Fiber {
  let wip = current.alternate;
  if (wip === null) {
    wip = newFiber(current.type, pendingProps, current.key);
    wip.alternate = current;
    current.alternate = wip;
  } else {
    wip.props = pendingProps;
    wip.type = current.type;
    wip.key = current.key;
  }
  // Se hereda lo que persiste entre renders.
  wip.dom = current.dom;
  wip.stateNode = current.stateNode;
  wip.hooks = current.hooks; // el bailout preserva estado; el re-render los resetea.
  wip.root = current.root;
  // Combinamos la marca de "sucio" de ambos buffers: un dispatch pudo marcar el
  // fiber que ahora es el `alternate` (wip) mientras el `current` quedó limpio.
  wip.hasPendingUpdate = current.hasPendingUpdate || wip.hasPendingUpdate;
  // Se resetea lo específico de este render.
  wip.child = null;
  wip.sibling = null;
  wip.parent = null;
  wip.effectTag = 'NONE';
  wip.moved = false;
  wip.index = 0;
  wip.providerContext = null;
  wip.providerForced = false;
  return wip;
}

/** Clona los hijos de `current` como WIP sin re-ejecutar (usado en el bailout). */
function cloneChildFibers(current: Fiber, wip: Fiber): void {
  let currentChild = current.child;
  let prev: Fiber | null = null;
  while (currentChild) {
    const clone = createWorkInProgress(currentChild, currentChild.props);
    clone.parent = wip;
    clone.index = currentChild.index;
    if (prev === null) wip.child = clone;
    else prev.sibling = clone;
    prev = clone;
    currentChild = currentChild.sibling;
  }
}

// ----------------------------------------------------------------------------
// Comparación de props (para bailout y memo)
// ----------------------------------------------------------------------------

function shallowEqualProps(a: Props, b: Props): boolean {
  if (a === b) return true;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (k === 'children') {
      // children se compara por referencia; si el padre no re-renderizó, es la misma.
      if (a.children !== b.children) return false;
      continue;
    }
    if (!Object.is(a[k], b[k])) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// beginWork
// ----------------------------------------------------------------------------

/** Ejecuta el trabajo de un fiber y devuelve su primer hijo (o null). */
export function beginWork(fiber: Fiber): Fiber | null {
  const type = fiber.type;

  // Los providers nunca hacen bailout (deben empujar su valor siempre).
  if (isProvider(type)) return updateContextProvider(fiber);

  if (type === 'ROOT' || type === Fragment || isHostType(fiber)) {
    // Fibers "estructurales": intentan bailout por props referenciales.
    if (canBailout(fiber)) {
      cloneChildFibers(fiber.alternate as Fiber, fiber);
      return fiber.child;
    }
    return type === 'ROOT' || type === Fragment
      ? updateFragmentLike(fiber)
      : updateHostComponent(fiber);
  }

  if (isMemo(type)) return updateMemoComponent(fiber, type);
  if (isClassComponent(type)) return updateClassComponent(fiber);

  // Componente función.
  if (canBailout(fiber)) {
    cloneChildFibers(fiber.alternate as Fiber, fiber);
    return fiber.child;
  }
  return updateFunctionComponent(fiber);
}

/** ¿Se puede saltar el trabajo (bailout) reusando el subárbol anterior? */
function canBailout(fiber: Fiber): boolean {
  const current = fiber.alternate;
  if (current === null) return false; // primer render, hay que montar
  if (fiber.hasPendingUpdate) return false; // tiene setState pendiente
  if (R.forceRenderDepth > 0) return false; // dentro de un Provider cuyo value cambió
  // props referencialmente iguales => misma salida garantizada
  return fiber.props === current.props;
}

function updateHostComponent(fiber: Fiber): Fiber | null {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, fiber.props.children ?? []);
  return fiber.child;
}

function updateFragmentLike(fiber: Fiber): Fiber | null {
  reconcileChildren(fiber, fiber.props.children ?? []);
  return fiber.child;
}

function updateFunctionComponent(fiber: Fiber): Fiber | null {
  R.wipFiber = fiber;
  R.hookIndex = 0;
  fiber.hooks = [];
  fiber.hasPendingUpdate = false;

  const fn = fiber.type as (props: Props) => ReactElement | null;
  const child = fn(fiber.props);

  collectPassiveEffects(fiber);
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}

function updateMemoComponent(fiber: Fiber, memo: MemoComponent): Fiber | null {
  const current = fiber.alternate;
  if (
    current !== null &&
    !fiber.hasPendingUpdate &&
    R.forceRenderDepth === 0 &&
    memo.compare(current.props as Props, fiber.props)
  ) {
    cloneChildFibers(current, fiber);
    return fiber.child;
  }
  R.wipFiber = fiber;
  R.hookIndex = 0;
  fiber.hooks = [];
  fiber.hasPendingUpdate = false;
  const child = memo.type(fiber.props);
  collectPassiveEffects(fiber);
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}

function updateClassComponent(fiber: Fiber): Fiber | null {
  const Ctor = fiber.type as unknown as {
    new (props: Props): ComponentInstance;
  };
  let instance = fiber.stateNode;
  if (instance === null) {
    instance = new Ctor(fiber.props);
    fiber.stateNode = instance;
  }
  instance.props = fiber.props;
  instance._fiber = fiber;
  fiber.hasPendingUpdate = false;

  // Los error boundaries recuerdan el estado de la pila de contextos para
  // poder restaurarlo si un descendiente lanza una excepción.
  if (isErrorBoundary(fiber)) {
    fiber.ctxDepth = contextStack.length;
    fiber.forceDepth = R.forceRenderDepth;
  }

  const child = instance.render();
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}

function updateContextProvider(fiber: Fiber): Fiber | null {
  const context = (fiber.type as { _context: ReactContext<unknown> })._context;
  const value = (fiber.props as { value?: unknown }).value;
  const prevValue = fiber.alternate
    ? (fiber.alternate.props as { value?: unknown }).value
    : context._defaultValue;

  // push del valor, guardando el anterior para restaurarlo en completeWork.
  contextStack.push({ context, value: context._currentValue });
  context._currentValue = value;
  fiber.providerContext = context;

  if (fiber.alternate === null || !Object.is(prevValue, value)) {
    R.forceRenderDepth++;
    fiber.providerForced = true;
  }

  fiber.hasPendingUpdate = false;
  reconcileChildren(fiber, fiber.props.children ?? []);
  return fiber.child;
}

/** Recolecta los efectos pasivos (useEffect) que cambiaron, para el commit. */
function collectPassiveEffects(fiber: Fiber): void {
  if (!fiber.hooks) return;
  const root = fiber.root;
  if (!root) return;
  for (const hook of fiber.hooks) {
    if (hook.tag === 'effect' && hook.hasChanged) {
      const eff = hook as EffectHook;
      root.pendingEffects.push(() => {
        if (typeof eff.cleanup === 'function') eff.cleanup();
        const cleanup = eff.effect();
        eff.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
      });
    }
  }
}

// ----------------------------------------------------------------------------
// completeWork (pop de contextos de Provider)
// ----------------------------------------------------------------------------

function completeWork(fiber: Fiber): void {
  if (fiber.providerContext) {
    const entry = contextStack.pop();
    if (entry) entry.context._currentValue = entry.value; // restaura el anterior
    if (fiber.providerForced) R.forceRenderDepth--;
  }
}

// ----------------------------------------------------------------------------
// Reconciliación con keys y detección de movimientos (lastPlacedIndex)
// ----------------------------------------------------------------------------

function sameType(a: Fiber, b: ReactElement): boolean {
  return a.type === b.type;
}

export function reconcileChildren(returnFiber: Fiber, elements: ReactElement[]): void {
  const root = returnFiber.root as RootStateContainer;
  const deletions = root.deletions;

  // Mapa de fibers viejos por key (o índice si no hay key).
  const existing = new Map<Key | number, Fiber>();
  let old = returnFiber.alternate ? returnFiber.alternate.child : null;
  let oldIdx = 0;
  while (old) {
    const k = old.key != null ? old.key : oldIdx;
    existing.set(k, old);
    old.index = oldIdx;
    old = old.sibling;
    oldIdx++;
  }

  let prevSibling: Fiber | null = null;
  let lastPlacedIndex = 0;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const k: Key | number = element.key != null ? element.key : i;
    const matched = existing.get(k);
    let fiber: Fiber;

    if (matched && sameType(matched, element)) {
      // Reusar (posiblemente moviendo).
      fiber = createWorkInProgress(matched, element.props);
      fiber.effectTag = 'UPDATE';
      existing.delete(k);
      if (matched.index < lastPlacedIndex) {
        fiber.moved = true; // se movió a la derecha: reinsertar en el DOM
      } else {
        lastPlacedIndex = matched.index;
      }
    } else {
      if (matched) {
        // misma key, distinto tipo => borrar el viejo
        matched.effectTag = 'DELETION';
        deletions.push(matched);
        existing.delete(k);
      }
      fiber = createFiberFromElement(element);
      fiber.effectTag = 'PLACEMENT';
    }

    fiber.parent = returnFiber;
    fiber.root = root;
    fiber.index = i;

    if (i === 0) returnFiber.child = fiber;
    else if (prevSibling) prevSibling.sibling = fiber;
    prevSibling = fiber;
  }

  // Los que sobraron en el mapa se eliminan.
  for (const fiber of existing.values()) {
    fiber.effectTag = 'DELETION';
    deletions.push(fiber);
  }
}

// ----------------------------------------------------------------------------
// performUnitOfWork (begin + complete + búsqueda del siguiente)
// ----------------------------------------------------------------------------

export function performUnitOfWork(fiber: Fiber): Fiber | null {
  const next = beginWork(fiber);
  if (next) return next;

  let node: Fiber | null = fiber;
  while (node) {
    completeWork(node);
    if (node.sibling) return node.sibling;
    node = node.parent;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Commit phase
// ----------------------------------------------------------------------------

function getHostParentDom(fiber: Fiber): DomNode {
  let parent = fiber.parent;
  while (parent && !parent.dom) parent = parent.parent;
  return parent!.dom!;
}

/** Encuentra el nodo del DOM ante el cual insertar (para respetar el orden). */
function getHostSibling(fiber: Fiber): DomNode | null {
  let node: Fiber = fiber;
  // eslint-disable-next-line no-constant-condition
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.parent === null || isHostParent(node.parent)) return null;
      node = node.parent;
    }
    node = node.sibling;
    while (!isHostType(node)) {
      if (node.effectTag === 'PLACEMENT' || node.moved) continue siblings;
      if (node.child === null) continue siblings;
      node = node.child;
    }
    if (node.effectTag !== 'PLACEMENT' && !node.moved) return node.dom;
  }
}

/** Inserta el/los nodo(s) host del subárbol de `fiber` en su parent DOM. */
function commitPlacement(fiber: Fiber): void {
  const parentDom = getHostParentDom(fiber);
  const before = getHostSibling(fiber);
  placeNode(fiber, parentDom, before);
}

function placeNode(fiber: Fiber, parentDom: DomNode, before: DomNode | null): void {
  if (isHostType(fiber)) {
    if (fiber.dom) {
      if (before) parentDom.insertBefore(fiber.dom, before);
      else parentDom.appendChild(fiber.dom);
    }
  } else {
    // Fragment / función / clase: colocar sus hijos host.
    let child = fiber.child;
    while (child) {
      placeNode(child, parentDom, before);
      child = child.sibling;
    }
  }
}

export function commitRoot(root: RootStateContainer): void {
  root.deletions.forEach((f) => commitDeletion(f));
  root.deletions = [];

  if (root.wipRoot) commitWork(root.wipRoot.child);

  root.currentRoot = root.wipRoot;
  root.wipRoot = null;

  // Efectos pasivos (useEffect) después de mutar el DOM.
  const effects = root.pendingEffects;
  root.pendingEffects = [];
  effects.forEach((run) => run());
}

function commitWork(fiber: Fiber | null): void {
  if (!fiber) return;

  if (fiber.effectTag === 'PLACEMENT') {
    commitPlacement(fiber);
  } else if (fiber.effectTag === 'UPDATE') {
    if (fiber.dom && fiber.alternate) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    if (fiber.moved) commitPlacement(fiber);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/** Elimina un fiber del DOM ejecutando antes los cleanups de sus efectos. */
function commitDeletion(fiber: Fiber): void {
  runCleanups(fiber);
  const parentDom = getHostParentDom(fiber);
  removeHostNodes(fiber, parentDom);
}

function runCleanups(fiber: Fiber): void {
  if (fiber.hooks) {
    for (const hook of fiber.hooks) {
      if (hook.tag === 'effect' && typeof hook.cleanup === 'function') {
        hook.cleanup();
      }
    }
  }
  let child = fiber.child;
  while (child) {
    runCleanups(child);
    child = child.sibling;
  }
}

function removeHostNodes(fiber: Fiber, parentDom: DomNode): void {
  if (isHostType(fiber)) {
    if (fiber.dom && fiber.dom.parentNode === parentDom) {
      parentDom.removeChild(fiber.dom);
    }
  } else {
    let child = fiber.child;
    while (child) {
      removeHostNodes(child, parentDom);
      child = child.sibling;
    }
  }
}
