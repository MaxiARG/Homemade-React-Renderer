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
import type {
  ContextHook,
  Dispatch,
  EffectHook,
  Fiber,
  Hook,
  MemoHook,
  ReactContext,
  Reducer,
  ReducerHook,
  RefHook,
  SetStateAction,
  StateHook,
} from './types.js';

/** Reserva el "slot" del hook actual y devuelve el hook viejo (si existe). */
function slot(): { fiber: Fiber; old: Hook | undefined } {
  const fiber = R.wipFiber;
  if (!fiber || !fiber.hooks) {
    throw new Error('Los hooks solo pueden llamarse dentro del render de un componente.');
  }
  const old = fiber.alternate?.hooks?.[R.hookIndex];
  return { fiber, old };
}

function commitHook(fiber: Fiber, hook: Hook): void {
  fiber.hooks!.push(hook);
  R.hookIndex++;
}

function depsEqual(a: unknown[] | undefined, b: unknown[] | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// useReducer (base de useState)
// ----------------------------------------------------------------------------

export function useReducer<S, A>(
  reducer: Reducer<S, A>,
  initialArg: S,
  init?: (arg: S) => S,
): [S, Dispatch<A>] {
  const { fiber, old } = slot();
  const hook =
    (old as ReducerHook<S, A> | undefined) ??
    ({
      tag: 'reducer',
      state: init ? init(initialArg) : initialArg,
      queue: [],
      reducer,
      dispatch: null as unknown as Dispatch<A>,
    } as ReducerHook<S, A>);

  hook.reducer = reducer;

  // Aplicar las acciones encoladas desde el último render.
  if (hook.queue.length > 0) {
    for (const action of hook.queue) {
      hook.state = reducer(hook.state, action);
    }
    hook.queue.length = 0;
  }

  // dispatch estable: se crea una sola vez y usa un puntero al fiber vigente.
  if (!hook.dispatch) {
    const capturedHook = hook;
    hook.dispatch = (action: A) => {
      capturedHook.queue.push(action);
      // El fiber "vivo" es el último comprometido: lo guardamos en cada render.
      const target = fiberRef.current;
      if (target) {
        target.hasPendingUpdate = true;
        scheduleUpdate(target);
      }
    };
  }
  // fiberRef apunta siempre al fiber más reciente que montó este hook.
  const fiberRef = (hook as unknown as { _fiberRef?: { current: Fiber } })._fiberRef ?? {
    current: fiber,
  };
  fiberRef.current = fiber;
  (hook as unknown as { _fiberRef: { current: Fiber } })._fiberRef = fiberRef;

  commitHook(fiber, hook as unknown as Hook);
  return [hook.state, hook.dispatch];
}

// ----------------------------------------------------------------------------
// useState
// ----------------------------------------------------------------------------

export function useState<S>(initial: S): [S, Dispatch<SetStateAction<S>>] {
  const { fiber, old } = slot();
  const hook =
    (old as StateHook<S> | undefined) ??
    ({
      tag: 'state',
      state: typeof initial === 'function' ? (initial as () => S)() : initial,
      queue: [],
      dispatch: null as unknown as Dispatch<SetStateAction<S>>,
    } as StateHook<S>);

  // Aplicar acciones encoladas (valor directo o funcional).
  if (hook.queue.length > 0) {
    for (const action of hook.queue) {
      hook.state = action(hook.state);
    }
    hook.queue.length = 0;
  }

  if (!hook.dispatch) {
    const capturedHook = hook;
    hook.dispatch = (action: SetStateAction<S>) => {
      const updater =
        typeof action === 'function' ? (action as (p: S) => S) : () => action;
      capturedHook.queue.push(updater);
      const target = fiberRef.current;
      if (target) {
        target.hasPendingUpdate = true;
        scheduleUpdate(target);
      }
    };
  }
  const fiberRef = (hook as unknown as { _fiberRef?: { current: Fiber } })._fiberRef ?? {
    current: fiber,
  };
  fiberRef.current = fiber;
  (hook as unknown as { _fiberRef: { current: Fiber } })._fiberRef = fiberRef;

  commitHook(fiber, hook as unknown as Hook);
  return [hook.state, hook.dispatch];
}

// ----------------------------------------------------------------------------
// useRef
// ----------------------------------------------------------------------------

export function useRef<T>(initial: T): { current: T } {
  const { fiber, old } = slot();
  const hook =
    (old as RefHook<T> | undefined) ??
    ({ tag: 'ref', ref: { current: initial } } as RefHook<T>);
  commitHook(fiber, hook as unknown as Hook);
  return hook.ref;
}

// ----------------------------------------------------------------------------
// useMemo / useCallback
// ----------------------------------------------------------------------------

export function useMemo<T>(factory: () => T, deps: unknown[] | undefined): T {
  const { fiber, old } = slot();
  const oldMemo = old as MemoHook<T> | undefined;

  let hook: MemoHook<T>;
  if (oldMemo && deps && depsEqual(deps, oldMemo.deps)) {
    hook = oldMemo; // deps iguales: reusar el valor cacheado
  } else {
    hook = { tag: 'memo', value: factory(), deps };
  }
  commitHook(fiber, hook as unknown as Hook);
  return hook.value;
}

export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: unknown[] | undefined,
): T {
  return useMemo(() => callback, deps);
}

// ----------------------------------------------------------------------------
// useEffect
// ----------------------------------------------------------------------------

export function useEffect(
  effect: () => void | (() => void),
  deps?: unknown[],
): void {
  const { fiber, old } = slot();
  const oldEffect = old as EffectHook | undefined;

  const hasChanged = oldEffect ? !deps || !depsEqual(deps, oldEffect.deps) : true;

  const hook: EffectHook = {
    tag: 'effect',
    effect,
    deps,
    hasChanged,
    cleanup: oldEffect?.cleanup, // se conserva el cleanup previo
  };
  commitHook(fiber, hook);
}

// ----------------------------------------------------------------------------
// useContext
// ----------------------------------------------------------------------------

export function useContext<T>(context: ReactContext<T>): T {
  const { fiber } = slot();
  const value = context._currentValue;
  const hook: ContextHook<T> = { tag: 'context', context, value };
  commitHook(fiber, hook as unknown as Hook);
  return value;
}
