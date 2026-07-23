// ============================================================================
// Creación de elementos: createElement, createTextElement, Fragment, flatten.
// ============================================================================

import {
  Fragment,
  TEXT_ELEMENT,
  type ElementType,
  type Key,
  type Props,
  type ReactElement,
  type ReactNode,
} from './types.js';

export { Fragment };

/** Aplana recursivamente arrays anidados de hijos (soporta `lista.map(...)`). */
function flatten(arr: ReactNode[]): ReactNode[] {
  return arr.reduce<ReactNode[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

/** Envuelve un valor primitivo (string/number) como elemento de texto. */
export function createTextElement(text: string | number): ReactElement {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}

/**
 * Normaliza un hijo cualquiera a `ReactElement`, o `null` si debe ignorarse.
 * React ignora `null`, `undefined` y booleanos (habilita `{cond && <X/>}`).
 */
function normalizeChild(child: ReactNode): ReactElement | null {
  if (child == null || typeof child === 'boolean') return null;
  if (typeof child === 'object' && !Array.isArray(child)) return child;
  return createTextElement(child as string | number);
}

/**
 * Construye un elemento. Extrae `key` de las props (no se pasa a los hijos
 * como prop normal) y normaliza/aplana los hijos.
 */
export function createElement(
  type: ElementType,
  config: (Props & { key?: Key }) | null,
  ...children: ReactNode[]
): ReactElement {
  const props: Props = {};
  let key: Key = null;

  if (config) {
    for (const name in config) {
      if (name === 'key') {
        key = (config.key ?? null) as Key;
      } else {
        props[name] = config[name];
      }
    }
  }

  const kids = flatten(children)
    .map(normalizeChild)
    .filter((c): c is ReactElement => c !== null);
  // Solo se incluye `children` si hay hijos: así memo/bailout pueden comparar
  // props por igualdad superficial sin un array vacío distinto en cada render.
  if (kids.length > 0) props.children = kids;

  return { type, props, key };
}
