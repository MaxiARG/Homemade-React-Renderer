// import * as React from './React';
// eliminar el globa.d.ts, pero hay que importar eso en todos los tsx que declare

const Label = ({theLabel}) => {
console.log('Label Render started ejecutado exitosamente')
  window.React.useEffect(()=>{
    console.log('Label useEffect ejecutado exitosamente')
  }, [])
console.log('Label Render finished ejecutado exitosamente')
  return <h3>{theLabel}</h3>;
};

export default Label;
