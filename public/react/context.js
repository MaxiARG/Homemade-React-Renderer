// ============================================================================
// createContext + Provider.
// ============================================================================

import { Fragment } from './types.js';
/**
 * Crea un contexto. El `Provider` es un componente función marcado que el
 * reconciliador reconoce para empujar el valor en la pila de contextos.
 * El consumidor lee el valor con `useContext`.
 */
export function createContext(defaultValue) {
  var context = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    _isContextProvider: true,
    // Se completa abajo (referencia circular Provider <-> context).
    Provider: undefined
  };
  var Provider = function Provider(props) {
    var _props$children;
    // El reconciliador maneja push/pop del valor y reconcilia estos hijos
    // directamente; este cuerpo es un fallback si alguna vez se invocara.
    return {
      type: Fragment,
      key: null,
      props: {
        children: (_props$children = props.children) !== null && _props$children !== void 0 ? _props$children : []
      }
    };
  };
  Provider._context = context;
  context.Provider = Provider;
  return context;
}