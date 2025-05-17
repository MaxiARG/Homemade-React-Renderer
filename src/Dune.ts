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
      children: children.map((child) =>
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
      children: [],
    },
  };
}

export function render(element: Element, container: HTMLElement): void {
  if (typeof element.type === 'function') {
    const component = element.type as FunctionComponent;
    const child = component(element.props);
    render(child, container);
    return;
  }

  const dom: Node =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode(element.props.nodeValue)
      : document.createElement(element.type);

  const isProperty = (key: string) => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = element.props[name];
    });

  element.props.children?.forEach((child) => render(child, dom as HTMLElement));
  container.appendChild(dom);
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

window.Dune = Dune; // o como lo hayas llamado
