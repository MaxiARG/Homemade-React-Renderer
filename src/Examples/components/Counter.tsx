const Counter = () => {
  const [state, setState] = window.React.useState(2)
  console.log('Counter Render started ejecutado exitosamente')

  window.React.useEffect(()=>{
    console.log('Counter useEffect ejecutado exitosamente')
  }, [])

  console.log('Counter Render finished ejecutado exitosamente')
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