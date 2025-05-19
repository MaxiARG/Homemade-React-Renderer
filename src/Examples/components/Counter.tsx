const Counter = () => {
  const [counter, setCounter] = window.React.useState(2)
  console.log('Counter Render started ejecutado exitosamente')

  window.React.useEffect(()=>{
    console.log('Counter useEffect ejecutado exitosamente')

    return(()=>{
       console.log('xx Counter useEffect cleanup ejecutado exitosamente xx')
    })
  }, [counter])

  console.log('Counter Render finished ejecutado exitosamente')
  return (
    <div>
      <button onClick={() => {
        console.log('onClick');
        setCounter(c => c + 1);
      }}>
        Click me
      </button>
      Counter: {counter}
    </div>
  );
};

export default Counter;