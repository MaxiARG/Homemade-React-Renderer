// ============================================================================
// Component: clase base mínima para componentes de clase y Error Boundaries.
// ============================================================================

import { scheduleUpdate } from './scheduler.js';
import type {
  ComponentInstance,
  Fiber,
  Props,
  ReactElement,
} from './types.js';

/**
 * Clase base al estilo React. Su única razón de ser aquí es habilitar
 * Error Boundaries (que en React deben ser componentes de clase con
 * `getDerivedStateFromError` / `componentDidCatch`).
 */
export abstract class Component<
  P extends object = Props,
  S extends Record<string, unknown> = Record<string, unknown>,
> implements ComponentInstance<P>
{
  static isReactComponent = true;

  props: P;
  state: S;
  _fiber?: Fiber;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  setState(partial: Partial<S>): void {
    this.state = { ...this.state, ...(partial as S) };
    if (this._fiber) {
      this._fiber.hasPendingUpdate = true;
      scheduleUpdate(this._fiber);
    }
  }

  abstract render(): ReactElement | null;
}

/** ¿Es `type` un componente de clase? */
export function isClassComponent(
  type: unknown,
): type is { new (props: object): ComponentInstance; isReactComponent?: boolean } {
  return (
    typeof type === 'function' &&
    (type as { isReactComponent?: boolean }).isReactComponent === true
  );
}

/** ¿Este fiber es un Error Boundary (clase con manejador de error)? */
export function isErrorBoundary(fiber: Fiber): boolean {
  const type = fiber.type as {
    getDerivedStateFromError?: unknown;
    prototype?: { componentDidCatch?: unknown };
  };
  return (
    isClassComponent(fiber.type) &&
    (typeof type.getDerivedStateFromError === 'function' ||
      typeof type.prototype?.componentDidCatch === 'function')
  );
}
