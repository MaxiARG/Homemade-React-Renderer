function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// ============================================================================
// Reconciliador: render phase (beginWork/completeWork), diffing con keys,
// doble buffer (createWorkInProgress), bailout, y commit phase.
// ============================================================================

import { createDom, updateDom } from './dom.js';
import { Fragment, TEXT_ELEMENT } from './types.js';
import { R, contextStack } from './internals.js';
// ----------------------------------------------------------------------------
// Clasificación de tipos
// ----------------------------------------------------------------------------

function isHostType(fiber) {
  return fiber.type === TEXT_ELEMENT || typeof fiber.type === 'string';
}
function isHostParent(fiber) {
  return isHostType(fiber) || fiber.type === 'ROOT';
}
export function isClassComponent(type) {
  return typeof type === 'function' && type.isReactComponent === true;
}
function isMemo(type) {
  return _typeof(type) === 'object' && type !== null && type.$$typeof === 'react.memo';
}
function isProvider(type) {
  return typeof type === 'function' && '_context' in type;
}
export function isErrorBoundary(fiber) {
  var _t$prototype;
  if (!isClassComponent(fiber.type)) return false;
  var t = fiber.type;
  return typeof t.getDerivedStateFromError === 'function' || typeof ((_t$prototype = t.prototype) === null || _t$prototype === void 0 ? void 0 : _t$prototype.componentDidCatch) === 'function';
}

// ----------------------------------------------------------------------------
// Construcción de fibers y doble buffer
// ----------------------------------------------------------------------------

function newFiber(type, props, key) {
  return {
    type: type,
    props: props,
    key: key,
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
    root: null
  };
}

/** Crea el fiber raíz (host root) asociado al contenedor del DOM. */
export function createHostRootFiber(container, props) {
  var fiber = newFiber('ROOT', props, null);
  fiber.dom = container;
  return fiber;
}
export function createFiberFromElement(element) {
  return newFiber(element.type, element.props, element.key);
}

/**
 * Doble buffer: reutiliza el fiber `alternate` de `current` como
 * work-in-progress en vez de crear siempre uno nuevo (reduce presión de GC).
 */
export function createWorkInProgress(current, pendingProps) {
  var wip = current.alternate;
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
function cloneChildFibers(current, wip) {
  var currentChild = current.child;
  var prev = null;
  while (currentChild) {
    var clone = createWorkInProgress(currentChild, currentChild.props);
    clone.parent = wip;
    clone.index = currentChild.index;
    if (prev === null) wip.child = clone;else prev.sibling = clone;
    prev = clone;
    currentChild = currentChild.sibling;
  }
}

// ----------------------------------------------------------------------------
// Comparación de props (para bailout y memo)
// ----------------------------------------------------------------------------

function shallowEqualProps(a, b) {
  if (a === b) return true;
  var ak = Object.keys(a);
  var bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (var _i = 0, _ak = ak; _i < _ak.length; _i++) {
    var k = _ak[_i];
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
export function beginWork(fiber) {
  var type = fiber.type;

  // Los providers nunca hacen bailout (deben empujar su valor siempre).
  if (isProvider(type)) return updateContextProvider(fiber);
  if (type === 'ROOT' || type === Fragment || isHostType(fiber)) {
    // Fibers "estructurales": intentan bailout por props referenciales.
    if (canBailout(fiber)) {
      cloneChildFibers(fiber.alternate, fiber);
      return fiber.child;
    }
    return type === 'ROOT' || type === Fragment ? updateFragmentLike(fiber) : updateHostComponent(fiber);
  }
  if (isMemo(type)) return updateMemoComponent(fiber, type);
  if (isClassComponent(type)) return updateClassComponent(fiber);

  // Componente función.
  if (canBailout(fiber)) {
    cloneChildFibers(fiber.alternate, fiber);
    return fiber.child;
  }
  return updateFunctionComponent(fiber);
}

/** ¿Se puede saltar el trabajo (bailout) reusando el subárbol anterior? */
function canBailout(fiber) {
  var current = fiber.alternate;
  if (current === null) return false; // primer render, hay que montar
  if (fiber.hasPendingUpdate) return false; // tiene setState pendiente
  if (R.forceRenderDepth > 0) return false; // dentro de un Provider cuyo value cambió
  // props referencialmente iguales => misma salida garantizada
  return fiber.props === current.props;
}
function updateHostComponent(fiber) {
  var _fiber$props$children;
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, (_fiber$props$children = fiber.props.children) !== null && _fiber$props$children !== void 0 ? _fiber$props$children : []);
  return fiber.child;
}
function updateFragmentLike(fiber) {
  var _fiber$props$children2;
  reconcileChildren(fiber, (_fiber$props$children2 = fiber.props.children) !== null && _fiber$props$children2 !== void 0 ? _fiber$props$children2 : []);
  return fiber.child;
}
function updateFunctionComponent(fiber) {
  R.wipFiber = fiber;
  R.hookIndex = 0;
  fiber.hooks = [];
  fiber.hasPendingUpdate = false;
  var fn = fiber.type;
  var child = fn(fiber.props);
  collectPassiveEffects(fiber);
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}
function updateMemoComponent(fiber, memo) {
  var current = fiber.alternate;
  if (current !== null && !fiber.hasPendingUpdate && R.forceRenderDepth === 0 && memo.compare(current.props, fiber.props)) {
    cloneChildFibers(current, fiber);
    return fiber.child;
  }
  R.wipFiber = fiber;
  R.hookIndex = 0;
  fiber.hooks = [];
  fiber.hasPendingUpdate = false;
  var child = memo.type(fiber.props);
  collectPassiveEffects(fiber);
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}
function updateClassComponent(fiber) {
  var Ctor = fiber.type;
  var instance = fiber.stateNode;
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
  var child = instance.render();
  reconcileChildren(fiber, child ? [child] : []);
  return fiber.child;
}
function updateContextProvider(fiber) {
  var _fiber$props$children3;
  var context = fiber.type._context;
  var value = fiber.props.value;
  var prevValue = fiber.alternate ? fiber.alternate.props.value : context._defaultValue;

  // push del valor, guardando el anterior para restaurarlo en completeWork.
  contextStack.push({
    context: context,
    value: context._currentValue
  });
  context._currentValue = value;
  fiber.providerContext = context;
  if (fiber.alternate === null || !Object.is(prevValue, value)) {
    R.forceRenderDepth++;
    fiber.providerForced = true;
  }
  fiber.hasPendingUpdate = false;
  reconcileChildren(fiber, (_fiber$props$children3 = fiber.props.children) !== null && _fiber$props$children3 !== void 0 ? _fiber$props$children3 : []);
  return fiber.child;
}

/** Recolecta los efectos pasivos (useEffect) que cambiaron, para el commit. */
function collectPassiveEffects(fiber) {
  if (!fiber.hooks) return;
  var root = fiber.root;
  if (!root) return;
  var _iterator = _createForOfIteratorHelper(fiber.hooks),
    _step;
  try {
    var _loop = function _loop() {
      var hook = _step.value;
      if (hook.tag === 'effect' && hook.hasChanged) {
        var eff = hook;
        root.pendingEffects.push(function () {
          if (typeof eff.cleanup === 'function') eff.cleanup();
          var cleanup = eff.effect();
          eff.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
        });
      }
    };
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

// ----------------------------------------------------------------------------
// completeWork (pop de contextos de Provider)
// ----------------------------------------------------------------------------

function completeWork(fiber) {
  if (fiber.providerContext) {
    var entry = contextStack.pop();
    if (entry) entry.context._currentValue = entry.value; // restaura el anterior
    if (fiber.providerForced) R.forceRenderDepth--;
  }
}

// ----------------------------------------------------------------------------
// Reconciliación con keys y detección de movimientos (lastPlacedIndex)
// ----------------------------------------------------------------------------

function sameType(a, b) {
  return a.type === b.type;
}
export function reconcileChildren(returnFiber, elements) {
  var root = returnFiber.root;
  var deletions = root.deletions;

  // Mapa de fibers viejos por key (o índice si no hay key).
  var existing = new Map();
  var old = returnFiber.alternate ? returnFiber.alternate.child : null;
  var oldIdx = 0;
  while (old) {
    var k = old.key != null ? old.key : oldIdx;
    existing.set(k, old);
    old.index = oldIdx;
    old = old.sibling;
    oldIdx++;
  }
  var prevSibling = null;
  var lastPlacedIndex = 0;
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var _k = element.key != null ? element.key : i;
    var matched = existing.get(_k);
    var fiber = void 0;
    if (matched && sameType(matched, element)) {
      // Reusar (posiblemente moviendo).
      fiber = createWorkInProgress(matched, element.props);
      fiber.effectTag = 'UPDATE';
      existing["delete"](_k);
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
        existing["delete"](_k);
      }
      fiber = createFiberFromElement(element);
      fiber.effectTag = 'PLACEMENT';
    }
    fiber.parent = returnFiber;
    fiber.root = root;
    fiber.index = i;
    if (i === 0) returnFiber.child = fiber;else if (prevSibling) prevSibling.sibling = fiber;
    prevSibling = fiber;
  }

  // Los que sobraron en el mapa se eliminan.
  var _iterator2 = _createForOfIteratorHelper(existing.values()),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _fiber = _step2.value;
      _fiber.effectTag = 'DELETION';
      deletions.push(_fiber);
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
}

// ----------------------------------------------------------------------------
// performUnitOfWork (begin + complete + búsqueda del siguiente)
// ----------------------------------------------------------------------------

export function performUnitOfWork(fiber) {
  var next = beginWork(fiber);
  if (next) return next;
  var node = fiber;
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

function getHostParentDom(fiber) {
  var parent = fiber.parent;
  while (parent && !parent.dom) parent = parent.parent;
  return parent.dom;
}

/** Encuentra el nodo del DOM ante el cual insertar (para respetar el orden). */
function getHostSibling(fiber) {
  var node = fiber;
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
function commitPlacement(fiber) {
  var parentDom = getHostParentDom(fiber);
  var before = getHostSibling(fiber);
  placeNode(fiber, parentDom, before);
}
function placeNode(fiber, parentDom, before) {
  if (isHostType(fiber)) {
    if (fiber.dom) {
      if (before) parentDom.insertBefore(fiber.dom, before);else parentDom.appendChild(fiber.dom);
    }
  } else {
    // Fragment / función / clase: colocar sus hijos host.
    var child = fiber.child;
    while (child) {
      placeNode(child, parentDom, before);
      child = child.sibling;
    }
  }
}
export function commitRoot(root) {
  root.deletions.forEach(function (f) {
    return commitDeletion(f);
  });
  root.deletions = [];
  if (root.wipRoot) commitWork(root.wipRoot.child);
  root.currentRoot = root.wipRoot;
  root.wipRoot = null;

  // Efectos pasivos (useEffect) después de mutar el DOM.
  var effects = root.pendingEffects;
  root.pendingEffects = [];
  effects.forEach(function (run) {
    return run();
  });
}
function commitWork(fiber) {
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
function commitDeletion(fiber) {
  runCleanups(fiber);
  var parentDom = getHostParentDom(fiber);
  removeHostNodes(fiber, parentDom);
}
function runCleanups(fiber) {
  if (fiber.hooks) {
    var _iterator3 = _createForOfIteratorHelper(fiber.hooks),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var hook = _step3.value;
        if (hook.tag === 'effect' && typeof hook.cleanup === 'function') {
          hook.cleanup();
        }
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  }
  var child = fiber.child;
  while (child) {
    runCleanups(child);
    child = child.sibling;
  }
}
function removeHostNodes(fiber, parentDom) {
  if (isHostType(fiber)) {
    if (fiber.dom && fiber.dom.parentNode === parentDom) {
      parentDom.removeChild(fiber.dom);
    }
  } else {
    var child = fiber.child;
    while (child) {
      removeHostNodes(child, parentDom);
      child = child.sibling;
    }
  }
}