// ============================================================================
// Barrel público del motor. Reúne todo en el objeto `React`.
// ============================================================================

import { Component } from './component.js';
import { createContext } from './context.js';
import { createElement, createTextElement, Fragment } from './element.js';
import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from './hooks.js';
import { createRoot, render } from './root.js';
import { flushSync } from './scheduler.js';
/** Comparación superficial de props por defecto para `memo`. */
function shallowEqual(a, b) {
  if (a === b) return true;
  var ak = Object.keys(a);
  var bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every(function (k) {
    return Object.is(a[k], b[k]);
  });
}

/**
 * Envuelve un componente para que solo se re-renderice si sus props cambian
 * (comparación superficial, o una función `areEqual` personalizada).
 */
export function memo(type) {
  var compare = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : shallowEqual;
  return {
    $$typeof: 'react.memo',
    type: type,
    compare: compare
  };
}
export { createElement, createTextElement, Fragment, createRoot, render, flushSync, createContext, Component, useState, useReducer, useRef, useMemo, useCallback, useEffect, useContext };
export var React = {
  createElement: createElement,
  Fragment: Fragment,
  createRoot: createRoot,
  render: render,
  flushSync: flushSync,
  createContext: createContext,
  Component: Component,
  memo: memo,
  useState: useState,
  useReducer: useReducer,
  useRef: useRef,
  useMemo: useMemo,
  useCallback: useCallback,
  useEffect: useEffect,
  useContext: useContext
};
export default React;