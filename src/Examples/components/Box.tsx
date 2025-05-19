const Box = () => {
  console.log('Box Render started ejecutado exitosamente')

  const thisIsMyFunction = () => {
    console.log('thisIsMyFunction thisIsMyFunction thisIsMyFunction thisIsMyFunction thisIsMyFunction')
  }
    window.React.useEffect(()=>{
    console.log('Box useEffect ejecutado exitosamente')
  }, [])


console.log('Box Render finished ejecutado exitosamente')
  return <div style="background-color: green">Just a big green box</div>;
};

export default Box;
