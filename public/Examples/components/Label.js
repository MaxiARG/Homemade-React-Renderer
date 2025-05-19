// import * as React from './React';
// eliminar el globa.d.ts, pero hay que importar eso en todos los tsx que declare

var Label = function Label(_ref) {
  var theLabel = _ref.theLabel;
  console.log('Label Render started ejecutado exitosamente');
  window.React.useEffect(function () {
    console.log('Label useEffect ejecutado exitosamente');
  }, []);
  console.log('Label Render finished ejecutado exitosamente');
  return /*#__PURE__*/React.createElement("h3", null, theLabel);
};
export default Label;