# This project is study of how React works internally.

The project integrates side tooling just like React does:

1- Babel: used for converting React style tags to HTML
2- Typescript

It showcases the main parts of the React engine:

a- Transpiling JSX/TSX to Javascript, which in turns makes it posible to write React tags and insert them in the DOM

b- React renderer, which allows to create a complex tree like data structure of React nodes

b- Scheduler, to allow the code to execute different task while the navigator is idle.

c- Fibers data structure, which allows to represent nodes, parents, children, siblings, current state and previous states. It also allows the reconciliation process when state changes.


If you add a breakpoint in one of your function components in a real React app, the call stack should show you:

workLoop
performUnitOfWork
updateFunctionComponent

these are a few things that React does differently:

Here, we are walking the whole tree during the render phase. React instead follows some hints and heuristics to skip entire sub-trees where nothing changed.


We are also walking the whole tree in the commit phase. React keeps a linked list with just the fibers that have effects and only visit those fibers.


Every time we build a new work in progress tree, we create new objects for each fiber. React recycles the fibers from the previous trees.


When React receives a new update during the render phase, it throws away the work in progress tree and starts again from the root. React tags each update with an expiration timestamp 
and uses it to decide which update has a higher priority.


There are also a few features that you can add easily:

use an object for the style prop
flatten children arrays
useEffect hook
reconciliation by key
