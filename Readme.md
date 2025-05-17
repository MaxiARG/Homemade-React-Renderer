# This project is study of how React works internally.

The project integrates side tooling just like React does:

1- Babel: used for converting React style tags to HTML
2- Typescript

It showcases the main parts of the React engine:

a- Transpiling JSX/TSX to Javascript, which in turns makes it posible to write React tags and insert them in the DOM

b- React renderer, which allows to create a complex tree like structure of React nodes

b- Scheduler, to allow the code to execute different task while the navigator is idle.

c- Fibers datastructure, which allows to represent nodes, parents, children, siblings, current state and previous states. It also allows the reconciliation process when state changes.

