//What is a Fiber Node?
//The goal of React Fiber is to increase its suitability for areas like animation, layout, and gestures. Its headline feature is incremental rendering: the ability to split rendering work into chunks and spread it out over multiple frames.
//Other key features include the ability to pause, abort, or reuse work as new updates come in; the ability to assign priority to different types of updates; and new concurrency primitives.
//https://medium.com/@aliWhosane/react-fiber-data-structure-demystified-d3794470a8a4
//In the React Fiber architecture, each fiber is a JavaScript object that contains several properties that describe the component that it represents, as well as pointers to its children, siblings, and parent. The main properties of fiber include:
const fiber = {
  // Type of the component or DOM node (e.g., "div", "App", "Button")
  type: 'div',
  //An optional string that uniquely identifies the component instance. This is used by React to optimize the reconciliation process by reusing existing components whenever possible.
  key: 3,
  props: {}, //An object that contains the properties that were passed to the component.
  stateNode: {},//A reference to the instance of the component that the fiber represents. For class components, this is the instance of the component class. For function components, this is a reference to the function itself.
  // Associated DOM node (if applicable)
  stateNode: document.createElement('div'),

  // Current fiber (the latest fiber representing this component)
  // Used to check if this fiber has been updated or not
  // during the next reconciliation phase
  return: null,
  child: null,
  sibling: null,
  index: 0,

  // Alternate fiber (the previous fiber representing this component)
  // Used to perform side effects and cleanup operations on the DOM
  // during the next commit phase
  // This is only used for non-concurrent mode
  // A reference to the corresponding fiber from the previous reconciliation. This allows React to compare the current fiber tree with the previous fiber tree and identify changes that need to be made to the DOM
  alternate: null,

  // Memoized props and state (the latest props and state for this component)
  // Used to check if the component needs to be updated during the next
  // reconciliation phase
  memoizedProps: {},
  memoizedState: {},

  // Expiration time (the deadline for when this component needs to be updated)
  // Used to prioritize which components to update during the next reconciliation phase
  expirationTime: 0,

  // Effect tag (a bitmask that describes what side effects this component has)
  // Used to perform side effects and cleanup operations on the DOM
  // during the next commit phase
  //A flag that indicates the type of update that needs to be performed on the DOM. This can include updates to the properties of existing DOM nodes, the creation or deletion of new DOM nodes, or other types of updates
  effectTag: 0,
  firstEffect: {},//A pointer to the first fiber in a linked list of fibers that represent the DOM nodes that need to be updated as a result of the current fiber.
  lastEffect: {},//A pointer to the last fiber in the linked list.
  nextEffect: {}, //A pointer to the next fiber in the linked list.
}

// When a component needs to be updated, React uses the fiber tree to determine which parts of the component tree need to be updated and in what order. The update process is split into multiple phases, each of which corresponds to a pass over the fiber tree.

// During the first phase, called the reconciliation phase, React compares the current fiber tree with the new fiber tree that corresponds to the updated component tree. React uses a diffing algorithm to determine which fiber nodes have changed and need to be updated.

// During the second phase, called the commit phase, React updates the DOM to reflect the changes in the fiber tree. React also calls any side-effect functions, such as useEffect hooks, that were scheduled to run after the component is rendered.

// Suppose we want to render an element tree like this one:

// Didact.render(
//   <div>
//     <h1>
//       <p />
//       <a />
//     </h1>
//     <h2 />
//   </div>,
//   container
// )
// In the render we’ll create the root fiber and set it as the nextUnitOfWork. The rest of the work will happen on the performUnitOfWork function, there we will do three things for each fiber:

// add the element to the DOM
// create the fibers for the element’s children
// select the next unit of work

// One of the goals of this data structure is to make it easy to find the next unit of work. That’s why each fiber has a link to its first child, its next sibling and its parent.
//When we finish performing work on a fiber, if it has a child that fiber will be the next unit of work.

// From our example, when we finish working on the div fiber the next unit of work will be the h1 fiber.
//If the fiber doesn’t have a child, we use the sibling as the next unit of work.

// For example, the p fiber doesn’t have a child so we move to the a fiber after finishing it.
//And if the fiber doesn’t have a child nor a sibling we go to the “uncle”: the sibling of the parent. Like a and h2 fibers from the example.

// Also, if the parent doesn’t have a sibling, we keep going up through the parents until we find one with a sibling or until we reach the root. If we have reached the root, it means we have finished performing all the work for this render.
