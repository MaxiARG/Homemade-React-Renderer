// ============================================================================
// createContext + Provider.
// ============================================================================

import { Fragment, type FunctionComponent, type ReactContext, type ReactElement } from './types.js';

interface ProviderComponent<T> extends FunctionComponent<{ value: T; children?: ReactElement[] }> {
  _context?: ReactContext<T>;
}

/**
 * Crea un contexto. El `Provider` es un componente función marcado que el
 * reconciliador reconoce para empujar el valor en la pila de contextos.
 * El consumidor lee el valor con `useContext`.
 */
export function createContext<T>(defaultValue: T): ReactContext<T> {
  const context: ReactContext<T> = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    _isContextProvider: true,
    // Se completa abajo (referencia circular Provider <-> context).
    Provider: undefined as unknown as FunctionComponent<{ value: T; children?: ReactElement[] }>,
  };

  const Provider: ProviderComponent<T> = (props) => {
    // El reconciliador maneja push/pop del valor y reconcilia estos hijos
    // directamente; este cuerpo es un fallback si alguna vez se invocara.
    return { type: Fragment, key: null, props: { children: props.children ?? [] } };
  };
  Provider._context = context;

  context.Provider = Provider;
  return context;
}
