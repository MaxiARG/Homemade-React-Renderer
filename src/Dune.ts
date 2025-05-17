type Props = {
  [key: string]: any;
  children?: Element[];
};

type FunctionComponent = (props: Props) => Element;

type Element = {
  type: string | FunctionComponent;
  props: Props;
};
// aun no implementada
type Fiber = {
  type: string | FunctionComponent;
  props: Props;
  dom: HTMLElement | Text | null;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  alternate?: Fiber;
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
};

let wipFiber = null
let hookIndex = null


let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null

export function createElement(
  type: string,
  props: Props,
  ...children: any[]
): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>// es un objeto o es un texto.
        typeof child === 'object' ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text: string): Element {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [], // elementos de texto no tienen children.
    },
  };
}

//So we need an array to keep track of the nodes we want to remove.
let deletions = [];

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let prevSibling = null
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  //Recorre desde el Root hacia los children
  //Cuando se acaban los children, busca nodos hermanos
  // Cuando se acaban los hermanos busca hermanos de su parent 
  // Y si se acaban busca hermanos de su abuelo y asi hasta volver al root.

  while (index < elements.length ||
    oldFiber != null
  ) {

    const element = elements[index]
    let newFiber = null
    //deletions = []
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type


    // TODO compare oldFiber to element
    /*     We iterate at the same time over the children of the old fiber (wipFiber.alternate) and the array of elements we want to reconcile.
    If we ignore all the boilerplate needed to iterate over an array and a linked list at the same time, we are left with what matters most inside this while: oldFiber and element. The element is the thing we want to render to the DOM and the oldFiber is what we rendered the last time.
    We need to compare them to see if there’s any change we need to apply to the DOM.
     */
    // Here React also uses keys, that makes a better reconciliation. For example, it detects when children change places in the element array.
    if (sameType) {
      // TODO update the node
      //When the old fiber and the element have the same type, we create a new fiber keeping the DOM node from the old fiber and the props from the element.
      // We also add a new property to the fiber: the effectTag. We’ll use this property later, during the commit phase.
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // TODO add this node
      // Then for the case where the element needs a new DOM node we tag the new fiber with the PLACEMENT effect tag.
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
      //And for the case where we need to delete the node, we don’t have a new fiber so we add the effect tag to the old fiber.
      // But when we commit the fiber tree to the DOM we do it from the work in progress root, which doesn’t have the old fibers.
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)

    }

    /*     const newFiber = {
          type: element.type,
          props: element.props,
          parent: wipFiber,
          dom: null,
        } */



    //And we add it to the fiber tree setting it either as a child or as a sibling, depending on whether it’s the first child or not.
    if (newFiber) {
      if (index === 0) {
        wipFiber.child = newFiber
      } else {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }
    // porque es una double linked list!
    prevSibling = newFiber
    index++

  }

}


function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}
//When the function component calls useState, we check if we have an old hook. We check in the alternate of the fiber using the hook index.
// If we have an old hook, we copy the state from the old hook to the new hook, if we don’t we initialize the state.
// Then we add the new hook to the fiber, increment the hook index by one, and return the state.
function useState(initial) {

  if (!wipFiber || !wipFiber.hooks) {
    throw new Error("Hooks can only be used inside function components");
  }

  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }
  //we haven’t run the action yet, We do it the next time we are rendering the component, we get all the actions from the old hook queue, and then apply them one by one to the new hook state, so when we return the state it’s updated.
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })
  //   useState should also return a function to update the state, so we define a setState function that receives an action (for the Counter example this action is the function that increments the state by one).
  // We push that action to a queue we added to the hook.
  // And then we do something similar to what we did in the render function, set a new work in progress root as the next unit of work so the work loop can start a new render phase.
  const setState = action => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot //Esto hace que se ejecute un nuevo render
    deletions = []
  }


  wipFiber.hooks.push(hook)
  hookIndex++

  return [hook.state, setState]

}

//And in updateFunctionComponent we run the function to get the children.
// For our example, here the fiber.type is the App function and when we run it, it returns the h1 element.
// Then, once we have the children, the reconciliation works in the same way, we don’t need to change anything there.
function updateFunctionComponent(fiber) {

  //We need to initialize some global variables before calling the function component so we can use them inside of the useState function.
  //First we set the work in progress fiber.
  //We also add a hooks array to the fiber to support calling useState several times in the same component. And we keep track of the current hook index.
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []


  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}


//Function components are differents in two ways:
// the fiber from a function component doesn’t have a DOM node
// and the children come from running the function instead of getting them directly from the props

function performUnitOfWork(fiber) {
  // TODO: agregar el dom node
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  // TODO: return  next unit of work
  //Finally we search for the next unit of work. We first try with the child, then with the sibling, then with the uncle, and so on.
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)
  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  // Set event listeners
  Object.keys(fiber.props)
    .filter(isEvent)
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2); // "onClick" -> "click"
      dom.addEventListener(eventType, fiber.props[name]);
    });

  return dom
}

const isEvent = key => key.startsWith("on")
//One special kind of prop that we need to update are event listeners, so if the prop name starts with the “on” prefix we’ll handle them differently.
const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

//We compare the props from the old fiber to the props of the new fiber, remove the props that are gone, and set the props that are new or changed.
function updateDom(dom, prevProps, nextProps) {
  //If the event handler changed we remove it from the node.
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  //And then we add the new handler.
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  //Now that we have fibers without DOM nodes we need to change two things.
  //to find the parent of a DOM node we’ll need to go up the fiber tree until we find a fiber with a DOM node.
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  //If the fiber has a PLACEMENT effect tag we do the same as before, append the DOM node to the node from the parent fiber.
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    //And if it’s an UPDATE, we need to update the existing DOM node with the props that changed.
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    //If it’s a DELETION, we do the opposite, remove the child.
    //when removing a node we also need to keep going until we find a child with a DOM node.
    commitDeletion(fiber, domParent)
  }
  // recorrido recursivo por el fiber tree
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

function commitRoot() {
  //And then, when we are commiting the changes to the DOM, we also use the fibers from that array.
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

//Sali del Root y regrese. Significa que ya recorri todos los nodos.
//And once we finish all the work (we know it because there isn’t a next unit of work) we commit the whole fiber tree to the DOM.
/* if (!nextUnitOfWork && wipRoot) {
  commitRoot()
} */

//aca es donde se ejecuta el workloop cuando el navegador esta idle
requestIdleCallback(workLoop)

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop)
}

//We have another problem here.
// We are adding a new node to the DOM each time we work on an element. And, remember, the browser could interrupt our work before we finish rendering the whole tree. In that case, the user will see an incomplete UI. And we don’t want that.
// So we need to remove the part that mutates the DOM from here.
// Instead, we’ll keep track of the root of the fiber tree. We call it the work in progress root or wipRoot.
export function render(element: Element, container: HTMLElement): void {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot
  }
  deletions = [];
  // And then we do something similar to what we did in the render function, set a new work in progress root as the next unit of work so the work loop can start a new render phase.
  nextUnitOfWork = wipRoot // ejecuta nuevo render
}
// Step VI: Reconciliation
// So far we only added stuff to the DOM, but what about updating or deleting nodes?
// That’s what we are going to do now, we need to compare the elements we receive on the render function to the last fiber tree we committed to the DOM.
// So we need to save a reference to that “last fiber tree we committed to the DOM” after we finish the commit. We call it currentRoot.
// We also add the alternate property to every fiber. This property is a link to the old fiber, the fiber that we committed to the DOM in the previous commit phase.

export const Dune = {
  createElement,
  render,
  useState
};

declare global {
  interface Window {
    Dune: {
      createElement: (...args: any[]) => any;
      render: (...args: any[]) => any;
      useState: (...args: any[]) => any;
      Fragment?: any;
    };
  }
}

window.Dune = Dune;
