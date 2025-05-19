Por qué se considera una nueva arquitectura
Cambia cómo React procesa el árbol
De un stack recursivo y bloqueante a un sistema iterativo, pausable y granular.

Permite nuevas capacidades que antes eran imposibles

Concurrent Rendering (renderizar de a partes sin bloquear el hilo).

Suspense (esperar por data sin bloquear la UI).

Prioridades (renderizar cosas urgentes primero).

Lazy loading progresivo.

Mejor manejo de errores (Error Boundaries).

Divide el trabajo en fases explícitas

Render Phase (calcula qué cambiar, pausable, no muta el DOM).

Commit Phase (aplica los cambios al DOM, no pausable).

Unidad de trabajo granular: los Fibers

Cada nodo es una unidad que puede ser pausada o retomada.

Representa tanto el estado actual como el nuevo estado deseado.

✅ ¿Es solo un algoritmo nuevo?
No, es una arquitectura completa, porque:

Cambia el modelo mental interno de React.

Cambia cómo se estructuran los datos internamente.

Cambia cómo se ejecuta el trabajo.

📜 Declaración oficial (2017)
"Fiber is the complete rewrite of React’s core algorithm. It is the culmination of over two years of research by the React team."
— React Blog