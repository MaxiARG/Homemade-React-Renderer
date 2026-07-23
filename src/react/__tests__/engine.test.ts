// ============================================================================
// Batería de tests del motor. Se ejecuta en jsdom.
// Usamos `h = createElement` en vez de JSX para no depender del pragma.
// ============================================================================

import {
  Component,
  createContext,
  createElement,
  createRoot,
  flushSync,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactRoot,
} from '../index';
import type { Dispatch, ReactElement, SetStateAction } from '../types';

const h = createElement as (
  type: unknown,
  props?: Record<string, unknown> | null,
  ...children: unknown[]
) => ReactElement;

function mount(el: ReactElement): { container: HTMLElement; root: ReactRoot } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(el);
  return { container, root };
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ----------------------------------------------------------------------------
describe('render básico', () => {
  test('monta host + texto', () => {
    const { container } = mount(h('h1', null, 'Hola ', 'Mundo'));
    expect(container.innerHTML).toBe('<h1>Hola Mundo</h1>');
  });

  test('ignora hijos null/undefined/boolean (bug 1)', () => {
    const { container } = mount(
      h('div', null, 'a', null, undefined, false, true, 'b'),
    );
    expect(container.textContent).toBe('ab');
  });

  test('aplica className y atributos', () => {
    const { container } = mount(h('div', { className: 'box', id: 'x' }, 'hi'));
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute('class')).toBe('box');
    expect(div.id).toBe('x');
  });

  test('estilo objeto: setea y limpia sub-claves al cambiar', () => {
    let setColor!: Dispatch<SetStateAction<Record<string, string>>>;
    function App() {
      const [style, s] = useState<Record<string, string>>({
        color: 'red',
        padding: '10px',
      });
      setColor = s;
      return h('div', { style }, 'x');
    }
    const { container } = mount(h(App));
    const div = container.firstChild as HTMLElement;
    expect(div.style.color).toBe('red');
    expect(div.style.padding).toBe('10px');
    flushSync(() => setColor({ color: 'blue' }));
    expect(div.style.color).toBe('blue');
    expect(div.style.padding).toBe(''); // se limpió la sub-clave que desapareció
  });
});

// ----------------------------------------------------------------------------
describe('useState + eventos + batching', () => {
  test('actualiza estado en un click', () => {
    function Counter() {
      const [n, setN] = useState(0);
      return h('button', { onClick: () => setN((c) => c + 1) }, `n=${n}`);
    }
    const { container } = mount(h(Counter));
    const btn = container.firstChild as HTMLButtonElement;
    expect(btn.textContent).toBe('n=0');
    flushSync(() => btn.click());
    expect(btn.textContent).toBe('n=1');
  });

  test('batching: dos setState en un tick = un solo re-render', () => {
    let renders = 0;
    let setA!: Dispatch<SetStateAction<number>>;
    let setB!: Dispatch<SetStateAction<number>>;
    function App() {
      renders++;
      const [a, sa] = useState(0);
      const [b, sb] = useState(0);
      setA = sa;
      setB = sb;
      return h('div', null, `${a}-${b}`);
    }
    const { container } = mount(h(App));
    expect(renders).toBe(1);
    flushSync(() => {
      setA(1);
      setB(2);
    });
    expect(container.textContent).toBe('1-2');
    expect(renders).toBe(2); // no 3
  });
});

// ----------------------------------------------------------------------------
describe('bailout / rendimiento', () => {
  test('un setState no re-renderiza al hermano sin cambios', () => {
    let siblingRenders = 0;
    let statefulRenders = 0;
    let setN!: Dispatch<SetStateAction<number>>;
    function Sibling() {
      siblingRenders++;
      return h('span', null, 'sib');
    }
    function Stateful() {
      statefulRenders++;
      const [n, s] = useState(0);
      setN = s;
      return h('span', null, String(n));
    }
    function App() {
      return h('div', null, h(Stateful), h(Sibling));
    }
    mount(h(App));
    expect(siblingRenders).toBe(1);
    expect(statefulRenders).toBe(1);
    flushSync(() => setN(5));
    expect(statefulRenders).toBe(2);
    expect(siblingRenders).toBe(1); // bailout: no volvió a renderizar
  });

  test('memo salta el re-render con props iguales', () => {
    let childRenders = 0;
    const Child = memo(function Child(_props: { label: string }) {
      childRenders++;
      return h('span', null, _props.label);
    });
    let setTick!: Dispatch<SetStateAction<number>>;
    function App() {
      const [tick, s] = useState(0);
      setTick = s;
      return h('div', null, String(tick), h(Child, { label: 'fijo' }));
    }
    mount(h(App));
    expect(childRenders).toBe(1);
    flushSync(() => setTick(1));
    expect(childRenders).toBe(1); // memo evitó el re-render
  });
});

// ----------------------------------------------------------------------------
describe('useEffect', () => {
  test('corre tras el commit y limpia en cambio de deps y desmontaje', () => {
    const log: string[] = [];
    let setN!: Dispatch<SetStateAction<number>>;
    let setShow!: Dispatch<SetStateAction<boolean>>;
    function Child() {
      const [n, s] = useState(0);
      setN = s;
      useEffect(() => {
        log.push(`effect ${n}`);
        return () => log.push(`cleanup ${n}`);
      }, [n]);
      return h('span', null, String(n));
    }
    function App() {
      const [show, s] = useState(true);
      setShow = s;
      return h('div', null, show ? h(Child) : null);
    }
    mount(h(App));
    expect(log).toEqual(['effect 0']);
    flushSync(() => setN(1));
    expect(log).toEqual(['effect 0', 'cleanup 0', 'effect 1']);
    flushSync(() => setShow(false));
    expect(log).toEqual(['effect 0', 'cleanup 0', 'effect 1', 'cleanup 1']);
  });

  test('deps [] corre una sola vez', () => {
    let runs = 0;
    let setN!: Dispatch<SetStateAction<number>>;
    function App() {
      const [n, s] = useState(0);
      setN = s;
      useEffect(() => {
        runs++;
      }, []);
      return h('span', null, String(n));
    }
    mount(h(App));
    flushSync(() => setN(1));
    flushSync(() => setN(2));
    expect(runs).toBe(1);
  });
});

// ----------------------------------------------------------------------------
describe('useRef / useMemo / useCallback', () => {
  test('useRef mantiene identidad entre renders', () => {
    const refs: Array<{ current: number }> = [];
    let setN!: Dispatch<SetStateAction<number>>;
    function App() {
      const [n, s] = useState(0);
      setN = s;
      const ref = useRef(0);
      refs.push(ref);
      return h('span', null, String(n));
    }
    mount(h(App));
    flushSync(() => setN(1));
    expect(refs[0]).toBe(refs[1]); // misma referencia
  });

  test('useMemo recalcula solo cuando cambian deps', () => {
    let computes = 0;
    let setA!: Dispatch<SetStateAction<number>>;
    let setB!: Dispatch<SetStateAction<number>>;
    function App() {
      const [a, sa] = useState(0);
      const [b, sb] = useState(0);
      setA = sa;
      setB = sb;
      useMemo(() => {
        computes++;
        return a * 2;
      }, [a]);
      return h('span', null, `${a}-${b}`);
    }
    mount(h(App));
    expect(computes).toBe(1);
    flushSync(() => setB(1)); // no cambia `a`
    expect(computes).toBe(1);
    flushSync(() => setA(1)); // cambia `a`
    expect(computes).toBe(2);
  });

  test('useCallback devuelve la misma función si deps no cambian', () => {
    const cbs: Array<() => void> = [];
    let setB!: Dispatch<SetStateAction<number>>;
    function App() {
      const [b, sb] = useState(0);
      setB = sb;
      const cb = useCallback(() => {}, []);
      cbs.push(cb);
      return h('span', null, String(b));
    }
    mount(h(App));
    flushSync(() => setB(1));
    expect(cbs[0]).toBe(cbs[1]);
  });
});

// ----------------------------------------------------------------------------
describe('useReducer', () => {
  test('despacha acciones', () => {
    let dispatch!: Dispatch<{ type: string }>;
    function App() {
      const [state, d] = useReducer(
        (s: number, a: { type: string }) => (a.type === 'inc' ? s + 1 : s),
        0,
      );
      dispatch = d;
      return h('span', null, String(state));
    }
    const { container } = mount(h(App));
    expect(container.textContent).toBe('0');
    flushSync(() => dispatch({ type: 'inc' }));
    expect(container.textContent).toBe('1');
  });
});

// ----------------------------------------------------------------------------
describe('useContext', () => {
  test('lee el valor del provider y re-renderiza al cambiar', () => {
    const Theme = createContext('light');
    let setTheme!: Dispatch<SetStateAction<string>>;
    function Consumer() {
      const theme = useContext(Theme);
      return h('span', null, theme);
    }
    function App() {
      const [theme, s] = useState('light');
      setTheme = s;
      return h(Theme.Provider, { value: theme }, h(Consumer));
    }
    const { container } = mount(h(App));
    expect(container.textContent).toBe('light');
    flushSync(() => setTheme('dark'));
    expect(container.textContent).toBe('dark');
  });
});

// ----------------------------------------------------------------------------
describe('reconciliación por key', () => {
  test('reordenar preserva nodos del DOM y el estado', () => {
    let setOrder!: Dispatch<SetStateAction<string[]>>;
    function Item({ id }: { id: string }) {
      const [n, setN] = useState(0);
      return h(
        'li',
        { 'data-id': id, onClick: () => setN((c) => c + 1) },
        `${id}:${n}`,
      );
    }
    function List() {
      const [order, s] = useState(['a', 'b', 'c']);
      setOrder = s;
      return h(
        'ul',
        null,
        ...order.map((id) => h(Item, { key: id, id })),
      );
    }
    const { container } = mount(h(List));
    const ul = container.firstChild as HTMLElement;
    const nodeA = ul.querySelector('[data-id="a"]') as HTMLElement;

    // Incrementar el contador de "a".
    flushSync(() => nodeA.click());
    expect(nodeA.textContent).toBe('a:1');

    // Reordenar: [c, a, b].
    flushSync(() => setOrder(['c', 'a', 'b']));
    const children = Array.from(ul.children) as HTMLElement[];
    expect(children.map((c) => c.getAttribute('data-id'))).toEqual(['c', 'a', 'b']);
    // El nodo "a" es el MISMO objeto y conserva su estado.
    expect(ul.querySelector('[data-id="a"]')).toBe(nodeA);
    expect(nodeA.textContent).toBe('a:1');
  });

  test('elimina items que salen de la lista', () => {
    let setOrder!: Dispatch<SetStateAction<number[]>>;
    function List() {
      const [order, s] = useState([1, 2, 3]);
      setOrder = s;
      return h('ul', null, ...order.map((id) => h('li', { key: id }, String(id))));
    }
    const { container } = mount(h(List));
    expect(container.querySelectorAll('li').length).toBe(3);
    flushSync(() => setOrder([1, 3]));
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.textContent).toBe('13');
  });
});

// ----------------------------------------------------------------------------
describe('error boundaries', () => {
  test('captura un error y muestra fallback', () => {
    class Boundary extends Component<{ children?: ReactElement[] }, { failed: boolean }> {
      constructor(props: { children?: ReactElement[] }) {
        super(props);
        this.state = { failed: false };
      }
      static getDerivedStateFromError() {
        return { failed: true };
      }
      render() {
        if (this.state.failed) return h('p', null, 'fallback');
        return h('div', null, this.props.children as unknown as ReactElement);
      }
    }
    function Boom(): ReactElement {
      throw new Error('boom');
    }
    const { container } = mount(h(Boundary, null, h(Boom)));
    expect(container.textContent).toBe('fallback');
  });
});

// ----------------------------------------------------------------------------
describe('múltiples roots', () => {
  test('dos roots son independientes', () => {
    let setA!: Dispatch<SetStateAction<number>>;
    let setB!: Dispatch<SetStateAction<number>>;
    function AppA() {
      const [n, s] = useState(0);
      setA = s;
      return h('span', null, `A${n}`);
    }
    function AppB() {
      const [n, s] = useState(0);
      setB = s;
      return h('span', null, `B${n}`);
    }
    const a = mount(h(AppA));
    const b = mount(h(AppB));
    flushSync(() => setA(1));
    expect(a.container.textContent).toBe('A1');
    expect(b.container.textContent).toBe('B0'); // no afectado
    flushSync(() => setB(9));
    expect(b.container.textContent).toBe('B9');
    expect(a.container.textContent).toBe('A1');
  });
});
