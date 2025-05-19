var Box = function Box() {
  console.log('Box Render started ejecutado exitosamente');
  var thisIsMyFunction = function thisIsMyFunction() {
    console.log('thisIsMyFunction thisIsMyFunction thisIsMyFunction thisIsMyFunction thisIsMyFunction');
  };
  window.React.useEffect(function () {
    console.log('Box useEffect ejecutado exitosamente');
  }, []);
  console.log('Box Render finished ejecutado exitosamente');
  return /*#__PURE__*/React.createElement("div", {
    style: "background-color: green"
  }, "Just a big green box");
};
export default Box;