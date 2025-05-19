export type Props = {
    [key: string]: any;
    children?: Element[];
};

export type FunctionComponent = (props: Props) => Element;

export type Element = {
    type: string | FunctionComponent;
    props: Props;
};
// aun no implementada
export type Fiber = {
    type: string | FunctionComponent;
    props: Props;
    dom: HTMLElement | Text | null;
    parent?: Fiber;
    child?: Fiber;
    sibling?: Fiber;
    alternate?: Fiber;
    effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
};