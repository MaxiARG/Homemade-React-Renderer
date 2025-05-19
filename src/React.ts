import { Element, Props } from "./types/index"
//TODO: Move what needs to be moved to internal fiber
let wipFiber = null
let hookIndex = null
let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = null;//So we need an array to keep track of the nodes we want to remove.
//for useEffect
let wipEffects = []; // Global para recolectar efectos. Considerar llevar esto al Fiber

function flatten(arr) {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

export function createElement(
  type: string,
  props: Props,
  ...children: any[]
): Element {
  return {
    type,
    props: {
      ...props,
      children: flatten(children).map((child) => // It does 2 things, decides if the element is of type object or text, and also flattens arrays.
        // Flattening arrays is useful for doing stuff like {myListOfUsers.map(elem => <div>elem.name</div>)}
        //2) We do the flattening before sending the nodes to the reconciler.
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
      children: [], // Text elements don't have children
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

const isEvent = key => key.startsWith("on")
//if the prop name starts with the “on” prefix we’ll handle them differently.
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
      if (name === "style") {
        Object.keys(prevProps.style || {}).forEach(styleName => {
          dom.style[styleName] = "";
        });
      } else {
        dom[name] = "";
      }
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      if (name === "style" && typeof nextProps.style === "object") {
        Object.assign(dom.style, nextProps.style);
      } else {
        dom[name] = nextProps[name];
      }
    });

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

function commitRoot() {
  //And then, when we are commiting the changes to the DOM, we also use the fibers from that array.
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null

  // Ejecutar todos los useEffect. Estos siempre se ejecutan luego de haber ejecutado todo lo demas.
  wipEffects.forEach(e => e());
  wipEffects = [];

}


function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
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

// recorrer y limpiar los hooks del Fiber cuando un componente se elimina.
// Si el Fiber que se está eliminando tiene hooks, ejecuta los cleanups registrados en ellos antes de eliminarlo del DOM.
// De esta forma, incluso si el componente nunca vuelve a renderizar, sus efectos se limpian correctamente cuando es desmontado.
// Quote : React will call your cleanup function each time before the Effect runs again, and one final time when the component unmounts (gets removed)
function commitDeletion(fiber, domParent) {
  // Ejecutar cleanups de hooks antes de eliminar el nodo
  if (fiber.hooks) {
    fiber.hooks.forEach(hook => {
      if (typeof hook.cleanup === 'function') {
        hook.cleanup();
      }
    });
  }

  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else if (fiber.child) {
    commitDeletion(fiber.child, domParent);
  }
}

//We have another problem here.
// We are adding a new node to the DOM each time we work on an element. But the browser could interrupt our work before 
// we finish rendering the whole tree. In that case, the user will see an incomplete UI. And we don’t want that.
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
// We need to compare the elements we receive on the render function to the last fiber tree we committed to the DOM.
// So we need to save a reference to that “last fiber tree we committed to the DOM” after we finish the commit. We call it currentRoot.
// We also add the alternate property to every fiber. This property is a link to the old fiber, the fiber that we committed to the DOM in the previous commit phase.

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

//aca es donde se ejecuta el workloop cuando el navegador esta idle
// this function is one with the lowest priority to execute.
requestIdleCallback(workLoop)

//Function components are differents in two ways:
// the fiber from a function component doesn’t have a DOM node
// and the children come from running the function instead of getting them directly from the props
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  // Return  next unit of work
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


// in updateFunctionComponent we run the function to get the children.
// here the fiber.type is the App function and when we run it, it returns the h1 element.
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

  // Recolectar efectos después de reconciliar los children
  // guardar y ejecutar la función de cleanup si el efecto devuelve una función.
  //
  wipFiber.hooks.forEach(hook => {
    if (hook.effect && hook.hasChanged) {
      wipEffects.push(() => {
        // Ejecutar cleanup anterior si existe
        if (typeof hook.cleanup === 'function') {
          hook.cleanup();
        }

        // Ejecutar el efecto y guardar el nuevo cleanup si devuelve uno
        const cleanup = hook.effect();
        if (typeof cleanup === 'function') {
          hook.cleanup = cleanup;
        } else {
          hook.cleanup = undefined;
        }
      });
    }
  });
}

//When the function component calls useState, we check if we have an old hook. We check in the alternate of the fiber using the hook index.
// If we have an old hook, we copy the state from the old hook to the new hook, if we don’t we initialize the state.
// Then we add the new hook to the fiber, increment the hook index by one, and return the state.
function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }
  //we haven’t run the action yet, We do it the next time we are rendering the component, 
  // we get all the actions from the old hook queue, and then apply them one by one to the 
  // new hook state, so when we return the state it’s updated.
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })
  //   useState should also return a function to update the state, so we define a setState function that 
  // receives an action (for the Counter example this action is the function that increments the state by one).
  // We push that action to a queue we added to the hook.
  // And then we do something similar to what we did in the render function, set a new work in progress root
  //  as the next unit of work so the work loop can start a new render phase.
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

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}


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
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type


    // TODO compare oldFiber to element
    /*     We iterate at the same time over the children of the old fiber (wipFiber.alternate) and the array of elements we want to reconcile.
    If we ignore all the boilerplate needed to iterate over an array and a linked list at the same time, we are left with what matters
     most inside this while: oldFiber and element. The element is the thing we want to render to the DOM and the oldFiber is what we 
     rendered the last time.
    We need to compare them to see if there’s any change we need to apply to the DOM.
     */
    // Here React also uses keys, that makes a better reconciliation. For example, it detects when children change places in the element array.
    if (sameType) {
      // TODO update the node
      //When the old fiber and the element have the same type, we create a new fiber keeping the DOM node from the old fiber 
      // and the props from the element.
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
      //And for the case where we need to delete the node, we don’t have a new fiber so we add the effect tag to the old fiber.
      // But when we commit the fiber tree to the DOM we do it from the work in progress root, which doesn’t have the old fibers.
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)

    }
    //And we add it to the fiber tree setting it either as a child or as a sibling, depending on whether it’s the first child or not.
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }
    // Think of this as a double linked list!
    prevSibling = newFiber
    index++

  }

}
//Ejecución después del renderizado:
// Al igual que en React, tu implementación ejecuta los efectos después de que el componente ha sido renderizado y el DOM actualizado. Esto asegura que los efectos no bloqueen la actualización de la interfaz de usuario.
// Dependencias para controlar la ejecución:
// Tu uso de un array de dependencias para determinar si un efecto debe ejecutarse nuevamente es coherente con la funcionalidad de React. Esto permite optimizar el rendimiento evitando ejecuciones innecesarias de efectos.
//Persistencia de efectos entre renders:
// Al almacenar los efectos en la propiedad hooks del fiber, se mantiene la información necesaria para comparar dependencias entre renders, similar a cómo React maneja internamente los hooks.
//TODO: implementar cleanup cuando el useEffect retorna
//TODO React mantiene una lista de efectos por componente, permitiendo una ejecución más controlada y eficiente. En esta implementación, los efectos se almacenan en una lista global (wipEffects), lo que podría llevar a efectos no deseados si múltiples componentes están montados simultáneamente.
//Guardar el cleanup en el hook cuando el efecto se ejecuta.
// Ejecutarlo antes de volver a ejecutar el efecto o cuando el componente se desmonta.
export function useEffect(effect, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hasChanged = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true;

  const hook = {
    effect,
    deps,
    hasChanged,
    cleanup: oldHook?.cleanup, // Copia el cleanup anterior si existe
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
}

export const React = {
  createElement,
  render,
  useState,
  useEffect
};

declare global {
  interface Window {
    React: {
      createElement: (...args: any[]) => any;
      render: (...args: any[]) => any;
      useState: (...args: any[]) => any;
      useEffect: (...args: any[]) => any;
      Fragment?: any;
    };
  }
}
// TODO: remove this, and remove the declare global in favor of just using the  export const React.
window.React = React;
