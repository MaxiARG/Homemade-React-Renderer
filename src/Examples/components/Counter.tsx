const Counter = () => {
  const [state, setState] = window.React.useState(2)

  return (
    <div>
      <button onClick={() => {
        console.log('onClick');
        setState(c => c + 1);
      }}>
        Click me
      </button>
      Counter: {state}
    </div>
  );
};

export default Counter;