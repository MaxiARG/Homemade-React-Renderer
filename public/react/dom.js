function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// ============================================================================
// Puente con el DOM: crear nodos y sincronizar props (atributos, eventos, estilos).
// Aquí viven las correcciones de los bugs 1-4 y el diff fino de estilos.
// ============================================================================

import { TEXT_ELEMENT } from './types.js';
var isEvent = function isEvent(key) {
  return key.startsWith('on');
};
var isReserved = function isReserved(key) {
  return key === 'children' || key === 'key' || key === 'nodeValue';
};
var isProperty = function isProperty(key) {
  return !isEvent(key) && !isReserved(key);
};

/**
 * Traduce el nombre del handler JSX al tipo de evento del DOM.
 * Bug 4: "onDoubleClick" debe mapear a "dblclick", no a "doubleclick".
 */
var EVENT_NAME_MAP = {
  ondoubleclick: 'dblclick'
};
function eventType(handlerName) {
  var _EVENT_NAME_MAP$lower;
  var lowered = handlerName.toLowerCase();
  return (_EVENT_NAME_MAP$lower = EVENT_NAME_MAP[lowered]) !== null && _EVENT_NAME_MAP$lower !== void 0 ? _EVENT_NAME_MAP$lower : lowered.substring(2);
}

/** Atributos que conviene reflejar como propiedad del nodo, no como attribute. */
var AS_PROPERTY = new Set(['value', 'checked', 'selected', 'muted']);

/** Aplica un valor de prop (que no es evento ni estilo) al nodo. */
function setProperty(dom, name, value) {
  // className / htmlFor son los alias JSX de los atributos class / for.
  if (name === 'className') {
    if (value == null) dom.removeAttribute('class');else dom.setAttribute('class', String(value));
    return;
  }
  if (name === 'htmlFor') {
    if (value == null) dom.removeAttribute('for');else dom.setAttribute('for', String(value));
    return;
  }
  if (AS_PROPERTY.has(name)) {
    // Propiedades vivas del elemento (inputs, etc.).
    dom[name] = value;
    return;
  }
  if (value == null || value === false) {
    dom.removeAttribute(name);
  } else if (value === true) {
    dom.setAttribute(name, '');
  } else {
    dom.setAttribute(name, String(value));
  }
}

/**
 * Sincroniza estilos con diff fino.
 * Bug 2: si el estilo previo era string, no se puede iterar con Object.keys.
 * Además, si ambos son objetos, se limpian las sub-claves que desaparecieron.
 */
function updateStyle(dom, prev, next) {
  var style = dom.style;

  // Caso: el nuevo estilo es un string (cssText completo).
  if (typeof next === 'string') {
    style.cssText = next;
    return;
  }

  // Si veníamos de un string y ahora es objeto (o nada), limpiamos primero.
  if (typeof prev === 'string') {
    style.cssText = '';
  }
  var prevObj = _typeof(prev) === 'object' && prev ? prev : {};
  var nextObj = _typeof(next) === 'object' && next ? next : {};

  // Quitar sub-claves que ya no están.
  for (var k in prevObj) {
    if (!(k in nextObj)) style.setProperty(dashCase(k), '');
  }
  // Setear nuevas o cambiadas.
  for (var _k in nextObj) {
    if (prevObj[_k] !== nextObj[_k]) {
      style.setProperty(dashCase(_k), String(nextObj[_k]));
    }
  }
}

/** backgroundColor -> background-color (permite escribir estilos en camelCase). */
function dashCase(prop) {
  return prop.replace(/[A-Z]/g, function (m) {
    return '-' + m.toLowerCase();
  });
}

/**
 * Aplica al `dom` la diferencia entre props viejas y nuevas:
 * quita listeners/props que cambiaron o desaparecieron y agrega los nuevos.
 */
export function updateDom(dom, prevProps, nextProps) {
  // Nodo de texto: solo importa nodeValue.
  if (dom instanceof Text) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      var _nextProps$nodeValue;
      dom.nodeValue = (_nextProps$nodeValue = nextProps.nodeValue) !== null && _nextProps$nodeValue !== void 0 ? _nextProps$nodeValue : '';
    }
    return;
  }
  var el = dom;

  // 1) Quitar/actualizar listeners viejos.
  for (var name in prevProps) {
    if (!isEvent(name)) continue;
    if (!(name in nextProps) || prevProps[name] !== nextProps[name]) {
      el.removeEventListener(eventType(name), prevProps[name]);
    }
  }

  // 2) Quitar props que desaparecieron.
  for (var _name in prevProps) {
    if (!isProperty(_name)) continue;
    if (!(_name in nextProps)) {
      if (_name === 'style') updateStyle(el, prevProps.style, undefined);else setProperty(el, _name, null);
    }
  }

  // 3) Setear props nuevas o cambiadas.
  for (var _name2 in nextProps) {
    if (!isProperty(_name2)) continue;
    if (prevProps[_name2] !== nextProps[_name2]) {
      if (_name2 === 'style') updateStyle(el, prevProps.style, nextProps.style);else setProperty(el, _name2, nextProps[_name2]);
    }
  }

  // 4) Agregar listeners nuevos.
  for (var _name3 in nextProps) {
    if (!isEvent(_name3)) continue;
    if (prevProps[_name3] !== nextProps[_name3]) {
      el.addEventListener(eventType(_name3), nextProps[_name3]);
    }
  }
}

/** Crea el nodo del DOM para un fiber host y aplica sus props iniciales. */
export function createDom(fiber) {
  var dom = fiber.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}