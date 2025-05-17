type Props = {
  [key: string]: any;
  children?: Element[];
};

type FunctionComponent = (props: Props) => Element;

type Element = {
  type: string | FunctionComponent;
  props: Props;
};

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

let nextUnitOfWork = null
let wipRoot = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}
//Sali del Root y regrese. Significa que ya recorri todos los nodos.
 if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  // TODO: agregar el dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
  // TODO: crear nuevas fibers
  // Then for each child we create a new fiber.
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
//And we add it to the fiber tree setting it either as a child or as a sibling, depending on whether it’s the first child or not.
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
// porque es una double linked list!
    prevSibling = newFiber
    index++

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
  //Recorre desde el Root hacia los children
  //Cuando se acaban los children, busca nodos hermanos
  // Cuando se acaban los hermanos busca hermanos de su parent 
  // Y si se acaban busca hermanos de su abuelo y asi hasta volver al root.

}

function createDom(fiber) {
    // if (typeof element.type === 'function') {
  //   const component = element.type as FunctionComponent;
  //   const child = component(element.props);
  //   render(child, container);
  //   return;
  // }
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
  return dom
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  // recorrido recursivo por el fiber tree
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitRoot () {
  commitWork(wipRoot.child)
  wipRoot = null
}

export function render(element: Element, container: HTMLElement): void {
wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
    nextUnitOfWork = wipRoot
}

export const Dune = {
  createElement,
  render,
};

declare global {
  interface Window {
    Dune: {
      createElement: (...args: any[]) => any;
      render: (...args: any[]) => any;
      Fragment?: any;
    };
  }
}

window.Dune = Dune;
