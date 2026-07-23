// ============================================================================
// Tipos del motor · Homemade React Renderer
// Todo el núcleo está tipado: no se usa `any` salvo en fronteras inevitables
// (props arbitrarias del usuario y el mapa de estilos del DOM).
// ============================================================================

/** Etiqueta especial para nodos de texto. */
export const TEXT_ELEMENT = 'TEXT_ONLY' as const;

/** Símbolo único que identifica un Fragment (`<>...</>`). */
export const Fragment = Symbol('React.Fragment');
export type FragmentType = typeof Fragment;

/** Clave de reconciliación estable (prop `key`). */
export type Key = string | number | null;

/** Diccionario de estilos inline. */
export type StyleObject = Record<string, string | number>;

/** Props genéricas de un elemento. `children` siempre normalizado a array. */
export interface Props {
  [key: string]: unknown;
  children?: ReactElement[];
  key?: Key;
  style?: StyleObject | string;
  nodeValue?: string;
}

/** Un componente función: recibe props y devuelve un elemento (o null). */
export type FunctionComponent<P extends object = Props> = (
  props: P & { children?: ReactElement[] },
) => ReactElement | null;

/** Constructor de componente de clase (usado por los Error Boundaries). */
export interface ComponentClass<P extends object = Props> {
  new (props: P): ComponentInstance<P>;
  /** Marca de React para reconocer clases. */
  isReactComponent?: boolean;
  /** Hook estático de error: deriva nuevo estado a partir del error. */
  getDerivedStateFromError?: (error: unknown) => object;
}

/** Instancia viva de un componente de clase. */
export interface ComponentInstance<P extends object = Props> {
  props: P;
  state: Record<string, unknown>;
  _fiber?: Fiber;
  setState(partial: Record<string, unknown>): void;
  render(): ReactElement | null;
  componentDidCatch?(error: unknown, info: { componentStack: string }): void;
}

/** El `type` de un elemento: etiqueta host, componente función, clase o Fragment. */
export type ElementType =
  | string
  | FunctionComponent<any>
  | ComponentClass<any>
  | FragmentType;

/** Descripción inmutable de UI producida por `createElement`. */
export interface ReactElement {
  type: ElementType;
  props: Props;
  key: Key;
}

/** Cualquier cosa que puede ser hijo antes de normalizar. */
export type ReactNode =
  | ReactElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactNode[];

// ----------------------------------------------------------------------------
// Hooks (unión discriminada por `tag`)
// ----------------------------------------------------------------------------

export type Dispatch<A> = (action: A) => void;
export type Reducer<S, A> = (state: S, action: A) => S;
export type SetStateAction<S> = S | ((prev: S) => S);

export interface StateHook<S = unknown> {
  tag: 'state';
  state: S;
  queue: Array<(prev: S) => S>;
  dispatch: Dispatch<SetStateAction<S>>;
}

export interface ReducerHook<S = unknown, A = unknown> {
  tag: 'reducer';
  state: S;
  queue: A[];
  reducer: Reducer<S, A>;
  dispatch: Dispatch<A>;
}

export interface EffectHook {
  tag: 'effect';
  effect: () => void | (() => void);
  deps: unknown[] | undefined;
  cleanup: (() => void) | undefined;
  hasChanged: boolean;
}

export interface RefHook<T = unknown> {
  tag: 'ref';
  ref: { current: T };
}

export interface MemoHook<T = unknown> {
  tag: 'memo';
  value: T;
  deps: unknown[] | undefined;
}

export interface ContextHook<T = unknown> {
  tag: 'context';
  context: ReactContext<T>;
  value: T;
}

export type Hook =
  | StateHook
  | ReducerHook
  | EffectHook
  | RefHook
  | MemoHook
  | ContextHook;

// ----------------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------------

export interface ReactContext<T> {
  _currentValue: T;
  _defaultValue: T;
  Provider: FunctionComponent<{ value: T; children?: ReactElement[] }>;
  /** Marca interna para reconocer un Provider durante la reconciliación. */
  _isContextProvider?: boolean;
}

// ----------------------------------------------------------------------------
// Fiber
// ----------------------------------------------------------------------------

export type EffectTag = 'PLACEMENT' | 'UPDATE' | 'DELETION' | 'NONE';

/** Nodo del DOM real asociado a un fiber host. */
export type DomNode = HTMLElement | Text;

export interface Fiber {
  /** Tipo del elemento (string, función, clase, Fragment) o `ROOT`/`TEXT_ONLY`. */
  type: ElementType | 'ROOT';
  props: Props;
  key: Key;

  /** Nodo del DOM (solo fibers host y el root). */
  dom: DomNode | null;

  // Enlaces del árbol.
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;

  /** Fiber de la reconciliación anterior (doble buffer). */
  alternate: Fiber | null;

  effectTag: EffectTag;

  /** Posición del fiber entre sus hermanos (para detección de movimientos con keys). */
  index: number;

  /** ¿Un fiber reusado que cambió de posición y hay que reinsertar en el DOM? */
  moved: boolean;

  /** Hooks del componente función, en orden de invocación. */
  hooks: Hook[] | null;

  /** Instancia del componente de clase, si aplica. */
  stateNode: ComponentInstance | null;

  /** ¿Tiene actualizaciones de estado pendientes? (para el bailout). */
  hasPendingUpdate: boolean;

  /** Contexto de Provider que este fiber empuja (si es un Provider). */
  providerContext: ReactContext<unknown> | null;

  /** ¿Este Provider incrementó forceRenderDepth (su value cambió)? */
  providerForced: boolean;

  /** Profundidad de la pila de contextos al comenzar este fiber (para error boundaries). */
  ctxDepth: number;
  /** Valor de forceRenderDepth al comenzar este fiber (para error boundaries). */
  forceDepth: number;

  /** Raíz a la que pertenece (para agendar re-renders desde los hooks). */
  root: RootStateContainer | null;
}

/** Componente envuelto en `memo` (bailout por comparación superficial de props). */
export interface MemoComponent<P extends object = Props> {
  $$typeof: 'react.memo';
  type: FunctionComponent<P>;
  compare: (prev: P, next: P) => boolean;
}

// ----------------------------------------------------------------------------
// Estado por-root (encapsula lo que antes eran variables globales de módulo)
// ----------------------------------------------------------------------------

export interface RootStateContainer {
  container: DomNode;
  /** Árbol comprometido en el último commit. */
  currentRoot: Fiber | null;
  /** Árbol en construcción. */
  wipRoot: Fiber | null;
  nextUnitOfWork: Fiber | null;
  deletions: Fiber[];
  /** Efectos pasivos recolectados en el render en curso, se ejecutan tras el commit. */
  pendingEffects: Array<() => void>;
  /** Fibers marcados como sucios por setState (para saber desde dónde re-renderizar). */
  dirtyFibers: Set<Fiber>;
}
