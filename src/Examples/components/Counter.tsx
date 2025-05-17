const Counter = () => {
  const [state, setState] = Dune.useState(2);

  return (
    <div>
      <button onClick={() => {
        console.log('asdasdasd');
        setState(c => c + 1);
      }}>
        Click me
      </button>
      Counter: {state}
    </div>
  );
};

export default Counter;