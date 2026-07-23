// ============================================================================
// Estado interno "de render en curso" (render-scoped).
//
// A diferencia del estado por-root (que persiste entre renders y vive en
// RootStateContainer), esto es efímero: apunta al fiber que se está renderizando
// AHORA. Es el equivalente al "currentlyRenderingFiber" de React y es
// intrínsecamente un singleton porque solo un fiber se renderiza a la vez.
// ============================================================================

export var R = {
  wipFiber: null,
  hookIndex: 0,
  activeRoot: null,
  forceRenderDepth: 0
};

/** Pila de valores de contexto (se empuja al entrar a un Provider y se saca al salir). */
export var contextStack = [];