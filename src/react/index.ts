// ============================================================================
// Barrel público del motor. Reúne todo en el objeto `React`.
// ============================================================================

import { Component } from './component.js';
import { createContext } from './context.js';
import { createElement, createTextElement, Fragment } from './element.js';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from './hooks.js';
import { createRoot, render, type ReactRoot } from './root.js';
import { flushSync } from './scheduler.js';
import type { FunctionComponent, MemoComponent, Props } from './types.js';

/** Comparación superficial de props por defecto para `memo`. */
function shallowEqual(a: Props, b: Props): boolean {
  if (a === b) return true;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.is(a[k], b[k]));
}

/**
 * Envuelve un componente para que solo se re-renderice si sus props cambian
 * (comparación superficial, o una función `areEqual` personalizada).
 */
export function memo<P extends object = Props>(
  type: FunctionComponent<P>,
  compare: (prev: P, next: P) => boolean = shallowEqual as (p: P, n: P) => boolean,
): MemoComponent<P> {
  return { $$typeof: 'react.memo', type, compare };
}

export {
  createElement,
  createTextElement,
  Fragment,
  createRoot,
  render,
  flushSync,
  createContext,
  Component,
  useState,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useContext,
};
export type { ReactRoot };

export const React = {
  createElement,
  Fragment,
  createRoot,
  render,
  flushSync,
  createContext,
  Component,
  memo,
  useState,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useContext,
};

export default React;
