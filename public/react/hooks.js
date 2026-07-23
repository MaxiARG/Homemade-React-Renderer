function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// ============================================================================
// Hooks: useState, useReducer, useRef, useMemo, useCallback, useEffect, useContext.
//
// Modelo de hooks PERSISTENTES: el objeto de cada hook se reutiliza entre
// renders (se lee de `wipFiber.alternate.hooks[i]` y se vuelve a empujar). Eso
// da identidad estable a `dispatch` y a los valores memoizados, tal como React.
// El orden de llamada define el índice del hook: por eso no se pueden llamar
// condicionalmente ("reglas de los hooks").
// ============================================================================

import { R } from './internals.js';
import { scheduleUpdate } from './scheduler.js';
/** Reserva el "slot" del hook actual y devuelve el hook viejo (si existe). */
function slot() {
  var _fiber$alternate;
  var fiber = R.wipFiber;
  if (!fiber || !fiber.hooks) {
    throw new Error('Los hooks solo pueden llamarse dentro del render de un componente.');
  }
  var old = (_fiber$alternate = fiber.alternate) === null || _fiber$alternate === void 0 || (_fiber$alternate = _fiber$alternate.hooks) === null || _fiber$alternate === void 0 ? void 0 : _fiber$alternate[R.hookIndex];
  return {
    fiber: fiber,
    old: old
  };
}
function commitHook(fiber, hook) {
  fiber.hooks.push(hook);
  R.hookIndex++;
}
function depsEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// useReducer (base de useState)
// ----------------------------------------------------------------------------

export function useReducer(reducer, initialArg, init) {
  var _ref, _fiberRef;
  var _slot = slot(),
    fiber = _slot.fiber,
    old = _slot.old;
  var hook = (_ref = old) !== null && _ref !== void 0 ? _ref : {
    tag: 'reducer',
    state: init ? init(initialArg) : initialArg,
    queue: [],
    reducer: reducer,
    dispatch: null
  };
  hook.reducer = reducer;

  // Aplicar las acciones encoladas desde el último render.
  if (hook.queue.length > 0) {
    var _iterator = _createForOfIteratorHelper(hook.queue),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var action = _step.value;
        hook.state = reducer(hook.state, action);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    hook.queue.length = 0;
  }

  // dispatch estable: se crea una sola vez y usa un puntero al fiber vigente.
  if (!hook.dispatch) {
    var capturedHook = hook;
    hook.dispatch = function (action) {
      capturedHook.queue.push(action);
      // El fiber "vivo" es el último comprometido: lo guardamos en cada render.
      var target = fiberRef.current;
      if (target) {
        target.hasPendingUpdate = true;
        scheduleUpdate(target);
      }
    };
  }
  // fiberRef apunta siempre al fiber más reciente que montó este hook.
  var fiberRef = (_fiberRef = hook._fiberRef) !== null && _fiberRef !== void 0 ? _fiberRef : {
    current: fiber
  };
  fiberRef.current = fiber;
  hook._fiberRef = fiberRef;
  commitHook(fiber, hook);
  return [hook.state, hook.dispatch];
}

// ----------------------------------------------------------------------------
// useState
// ----------------------------------------------------------------------------

export function useState(initial) {
  var _ref2, _fiberRef2;
  var _slot2 = slot(),
    fiber = _slot2.fiber,
    old = _slot2.old;
  var hook = (_ref2 = old) !== null && _ref2 !== void 0 ? _ref2 : {
    tag: 'state',
    state: typeof initial === 'function' ? initial() : initial,
    queue: [],
    dispatch: null
  };

  // Aplicar acciones encoladas (valor directo o funcional).
  if (hook.queue.length > 0) {
    var _iterator2 = _createForOfIteratorHelper(hook.queue),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var action = _step2.value;
        hook.state = action(hook.state);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    hook.queue.length = 0;
  }
  if (!hook.dispatch) {
    var capturedHook = hook;
    hook.dispatch = function (action) {
      var updater = typeof action === 'function' ? action : function () {
        return action;
      };
      capturedHook.queue.push(updater);
      var target = fiberRef.current;
      if (target) {
        target.hasPendingUpdate = true;
        scheduleUpdate(target);
      }
    };
  }
  var fiberRef = (_fiberRef2 = hook._fiberRef) !== null && _fiberRef2 !== void 0 ? _fiberRef2 : {
    current: fiber
  };
  fiberRef.current = fiber;
  hook._fiberRef = fiberRef;
  commitHook(fiber, hook);
  return [hook.state, hook.dispatch];
}

// ----------------------------------------------------------------------------
// useRef
// ----------------------------------------------------------------------------

export function useRef(initial) {
  var _ref3;
  var _slot3 = slot(),
    fiber = _slot3.fiber,
    old = _slot3.old;
  var hook = (_ref3 = old) !== null && _ref3 !== void 0 ? _ref3 : {
    tag: 'ref',
    ref: {
      current: initial
    }
  };
  commitHook(fiber, hook);
  return hook.ref;
}

// ----------------------------------------------------------------------------
// useMemo / useCallback
// ----------------------------------------------------------------------------

export function useMemo(factory, deps) {
  var _slot4 = slot(),
    fiber = _slot4.fiber,
    old = _slot4.old;
  var oldMemo = old;
  var hook;
  if (oldMemo && deps && depsEqual(deps, oldMemo.deps)) {
    hook = oldMemo; // deps iguales: reusar el valor cacheado
  } else {
    hook = {
      tag: 'memo',
      value: factory(),
      deps: deps
    };
  }
  commitHook(fiber, hook);
  return hook.value;
}
export function useCallback(callback, deps) {
  return useMemo(function () {
    return callback;
  }, deps);
}

// ----------------------------------------------------------------------------
// useEffect
// ----------------------------------------------------------------------------

export function useEffect(effect, deps) {
  var _slot5 = slot(),
    fiber = _slot5.fiber,
    old = _slot5.old;
  var oldEffect = old;
  var hasChanged = oldEffect ? !deps || !depsEqual(deps, oldEffect.deps) : true;
  var hook = {
    tag: 'effect',
    effect: effect,
    deps: deps,
    hasChanged: hasChanged,
    cleanup: oldEffect === null || oldEffect === void 0 ? void 0 : oldEffect.cleanup // se conserva el cleanup previo
  };
  commitHook(fiber, hook);
}

// ----------------------------------------------------------------------------
// useContext
// ----------------------------------------------------------------------------

export function useContext(context) {
  var _slot6 = slot(),
    fiber = _slot6.fiber;
  var value = context._currentValue;
  var hook = {
    tag: 'context',
    context: context,
    value: value
  };
  commitHook(fiber, hook);
  return value;
}