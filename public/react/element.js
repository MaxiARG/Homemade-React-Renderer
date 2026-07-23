function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// ============================================================================
// Creación de elementos: createElement, createTextElement, Fragment, flatten.
// ============================================================================

import { Fragment, TEXT_ELEMENT } from './types.js';
export { Fragment };

/** Aplana recursivamente arrays anidados de hijos (soporta `lista.map(...)`). */
function flatten(arr) {
  return arr.reduce(function (flat, item) {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

/** Envuelve un valor primitivo (string/number) como elemento de texto. */
export function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(text),
      children: []
    }
  };
}

/**
 * Normaliza un hijo cualquiera a `ReactElement`, o `null` si debe ignorarse.
 * React ignora `null`, `undefined` y booleanos (habilita `{cond && <X/>}`).
 */
function normalizeChild(child) {
  if (child == null || typeof child === 'boolean') return null;
  if (_typeof(child) === 'object' && !Array.isArray(child)) return child;
  return createTextElement(child);
}

/**
 * Construye un elemento. Extrae `key` de las props (no se pasa a los hijos
 * como prop normal) y normaliza/aplana los hijos.
 */
export function createElement(type, config) {
  var props = {};
  var key = null;
  if (config) {
    for (var name in config) {
      if (name === 'key') {
        var _config$key;
        key = (_config$key = config.key) !== null && _config$key !== void 0 ? _config$key : null;
      } else {
        props[name] = config[name];
      }
    }
  }
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }
  var kids = flatten(children).map(normalizeChild).filter(function (c) {
    return c !== null;
  });
  // Solo se incluye `children` si hay hijos: así memo/bailout pueden comparar
  // props por igualdad superficial sin un array vacío distinto en cada render.
  if (kids.length > 0) props.children = kids;
  return {
    type: type,
    props: props,
    key: key
  };
}