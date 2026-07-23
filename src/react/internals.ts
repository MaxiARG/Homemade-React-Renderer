// ============================================================================
// Estado interno "de render en curso" (render-scoped).
//
// A diferencia del estado por-root (que persiste entre renders y vive en
// RootStateContainer), esto es efímero: apunta al fiber que se está renderizando
// AHORA. Es el equivalente al "currentlyRenderingFiber" de React y es
// intrínsecamente un singleton porque solo un fiber se renderiza a la vez.
// ============================================================================

import type { Fiber, ReactContext, RootStateContainer } from './types.js';

interface RenderState {
  /** Fiber cuyo cuerpo (función/clase) se está ejecutando. */
  wipFiber: Fiber | null;
  /** Índice del próximo hook a leer/crear en `wipFiber.hooks`. */
  hookIndex: number;
  /** Root cuyo árbol se está construyendo. */
  activeRoot: RootStateContainer | null;
  /**
   * Profundidad de Providers cuyo `value` cambió respecto al commit anterior.
   * Mientras sea > 0, el bailout queda deshabilitado para forzar que los
   * consumidores de contexto vuelvan a renderizar.
   */
  forceRenderDepth: number;
}

export const R: RenderState = {
  wipFiber: null,
  hookIndex: 0,
  activeRoot: null,
  forceRenderDepth: 0,
};

/** Pila de valores de contexto (se empuja al entrar a un Provider y se saca al salir). */
export const contextStack: Array<{ context: ReactContext<unknown>; value: unknown }> = [];
