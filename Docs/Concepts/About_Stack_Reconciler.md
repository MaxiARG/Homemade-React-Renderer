📜 Antes de Fiber (React 15 y anteriores)
React usaba un árbol de elementos y componentes llamado "Stack Reconciler". Este árbol era recursivo y síncrono. Algunas características importantes eran:

Recursivo y Profundidad-Primero (Depth-First)

React descendía por el árbol de componentes usando recursión sin pausas.

Esto bloqueaba el hilo principal si el árbol era muy grande.

Sin interrumpibilidad

No podías pausar el trabajo para dejar que el navegador respondiera a eventos como scroll, animaciones o entrada del usuario.

Por ejemplo, si un render grande estaba en progreso, el navegador podía congelarse o tardar en responder.

Sin granularidad en efectos o prioridades

No había forma de asignar prioridad a ciertos renders (por ejemplo, una barra de búsqueda rápida versus una lista pesada).

No soportaba Suspense ni Concurrent Rendering

Todo el árbol se procesaba "de golpe".

📦 Qué era el "Stack Reconciler"
El Stack Reconciler mantenía un árbol de instancias de componentes (clases) o descripciones (para componentes funcionales o DOM) en una estructura similar a un árbol,
pero usaba el call stack del navegador para recorrerlo, lo que significaba que no podía suspender o pausar el trabajo una vez que había empezado.

No había una estructura tipo Fiber que representara cada unidad de trabajo individualmente en un nodo reutilizable o pausable.

🚩 Qué problema resolvió Fiber
Fiber reemplazó al Stack Reconciler para:

Hacer el renderizado interrumpible y pausable (Cooperative Scheduling).

Permitir priorización de actualizaciones.

Soportar features como Suspense y Concurrent Mode.

Separar el renderizado (calcular qué cambiar) del commit (aplicar los cambios al DOM).

