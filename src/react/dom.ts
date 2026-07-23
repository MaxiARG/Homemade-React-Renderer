// ============================================================================
// Puente con el DOM: crear nodos y sincronizar props (atributos, eventos, estilos).
// Aquí viven las correcciones de los bugs 1-4 y el diff fino de estilos.
// ============================================================================

import {
  TEXT_ELEMENT,
  type DomNode,
  type Fiber,
  type Props,
  type StyleObject,
} from './types.js';

const isEvent = (key: string): boolean => key.startsWith('on');
const isReserved = (key: string): boolean =>
  key === 'children' || key === 'key' || key === 'nodeValue';
const isProperty = (key: string): boolean => !isEvent(key) && !isReserved(key);

/**
 * Traduce el nombre del handler JSX al tipo de evento del DOM.
 * Bug 4: "onDoubleClick" debe mapear a "dblclick", no a "doubleclick".
 */
const EVENT_NAME_MAP: Record<string, string> = {
  ondoubleclick: 'dblclick',
};
function eventType(handlerName: string): string {
  const lowered = handlerName.toLowerCase();
  return EVENT_NAME_MAP[lowered] ?? lowered.substring(2);
}

/** Atributos que conviene reflejar como propiedad del nodo, no como attribute. */
const AS_PROPERTY = new Set(['value', 'checked', 'selected', 'muted']);

/** Aplica un valor de prop (que no es evento ni estilo) al nodo. */
function setProperty(dom: HTMLElement, name: string, value: unknown): void {
  // className / htmlFor son los alias JSX de los atributos class / for.
  if (name === 'className') {
    if (value == null) dom.removeAttribute('class');
    else dom.setAttribute('class', String(value));
    return;
  }
  if (name === 'htmlFor') {
    if (value == null) dom.removeAttribute('for');
    else dom.setAttribute('for', String(value));
    return;
  }
  if (AS_PROPERTY.has(name)) {
    // Propiedades vivas del elemento (inputs, etc.).
    (dom as unknown as Record<string, unknown>)[name] = value;
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
function updateStyle(
  dom: HTMLElement,
  prev: StyleObject | string | undefined,
  next: StyleObject | string | undefined,
): void {
  const style = dom.style;

  // Caso: el nuevo estilo es un string (cssText completo).
  if (typeof next === 'string') {
    style.cssText = next;
    return;
  }

  // Si veníamos de un string y ahora es objeto (o nada), limpiamos primero.
  if (typeof prev === 'string') {
    style.cssText = '';
  }

  const prevObj: StyleObject = typeof prev === 'object' && prev ? prev : {};
  const nextObj: StyleObject = typeof next === 'object' && next ? next : {};

  // Quitar sub-claves que ya no están.
  for (const k in prevObj) {
    if (!(k in nextObj)) style.setProperty(dashCase(k), '');
  }
  // Setear nuevas o cambiadas.
  for (const k in nextObj) {
    if (prevObj[k] !== nextObj[k]) {
      style.setProperty(dashCase(k), String(nextObj[k]));
    }
  }
}

/** backgroundColor -> background-color (permite escribir estilos en camelCase). */
function dashCase(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * Aplica al `dom` la diferencia entre props viejas y nuevas:
 * quita listeners/props que cambiaron o desaparecieron y agrega los nuevos.
 */
export function updateDom(dom: DomNode, prevProps: Props, nextProps: Props): void {
  // Nodo de texto: solo importa nodeValue.
  if (dom instanceof Text) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = nextProps.nodeValue ?? '';
    }
    return;
  }

  const el = dom as HTMLElement;

  // 1) Quitar/actualizar listeners viejos.
  for (const name in prevProps) {
    if (!isEvent(name)) continue;
    if (!(name in nextProps) || prevProps[name] !== nextProps[name]) {
      el.removeEventListener(eventType(name), prevProps[name] as EventListener);
    }
  }

  // 2) Quitar props que desaparecieron.
  for (const name in prevProps) {
    if (!isProperty(name)) continue;
    if (!(name in nextProps)) {
      if (name === 'style') updateStyle(el, prevProps.style, undefined);
      else setProperty(el, name, null);
    }
  }

  // 3) Setear props nuevas o cambiadas.
  for (const name in nextProps) {
    if (!isProperty(name)) continue;
    if (prevProps[name] !== nextProps[name]) {
      if (name === 'style') updateStyle(el, prevProps.style, nextProps.style);
      else setProperty(el, name, nextProps[name]);
    }
  }

  // 4) Agregar listeners nuevos.
  for (const name in nextProps) {
    if (!isEvent(name)) continue;
    if (prevProps[name] !== nextProps[name]) {
      el.addEventListener(eventType(name), nextProps[name] as EventListener);
    }
  }
}

/** Crea el nodo del DOM para un fiber host y aplica sus props iniciales. */
export function createDom(fiber: Fiber): DomNode {
  const dom: DomNode =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);
  return dom;
}
