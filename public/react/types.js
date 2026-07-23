// ============================================================================
// Tipos del motor · Homemade React Renderer
// Todo el núcleo está tipado: no se usa `any` salvo en fronteras inevitables
// (props arbitrarias del usuario y el mapa de estilos del DOM).
// ============================================================================

/** Etiqueta especial para nodos de texto. */
export var TEXT_ELEMENT = 'TEXT_ONLY';

/** Símbolo único que identifica un Fragment (`<>...</>`). */
export var Fragment = Symbol('React.Fragment');

/** Clave de reconciliación estable (prop `key`). */

/** Diccionario de estilos inline. */

/** Props genéricas de un elemento. `children` siempre normalizado a array. */

/** Un componente función: recibe props y devuelve un elemento (o null). */

/** Constructor de componente de clase (usado por los Error Boundaries). */

/** Instancia viva de un componente de clase. */

/** El `type` de un elemento: etiqueta host, componente función, clase o Fragment. */

/** Descripción inmutable de UI producida por `createElement`. */

/** Cualquier cosa que puede ser hijo antes de normalizar. */

// ----------------------------------------------------------------------------
// Hooks (unión discriminada por `tag`)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Fiber
// ----------------------------------------------------------------------------

/** Nodo del DOM real asociado a un fiber host. */

/** Componente envuelto en `memo` (bailout por comparación superficial de props). */

// ----------------------------------------------------------------------------
// Estado por-root (encapsula lo que antes eran variables globales de módulo)
// ----------------------------------------------------------------------------