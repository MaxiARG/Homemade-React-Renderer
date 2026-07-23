// ============================================================================
// Punto de entrada del motor "Homemade React".
//
// El motor real vive modularizado en `src/react/`. Este archivo solo re-exporta
// la API pública y expone `window.React` para la demo del navegador.
//
// Historial: antes todo el motor era un único archivo con estado global de
// módulo. Se refactorizó a módulos con estado por-root, tipado completo, keyed
// reconciliation, doble buffer, bailout, batching, context, memo, más hooks y
// error boundaries. Ver la carpeta Documentacion/ para el detalle.
// ============================================================================

export * from './react/index.js';
import { React } from './react/index.js';

export { React };

declare global {
  interface Window {
    React: typeof React;
  }
}

if (typeof window !== 'undefined') {
  window.React = React;
}
