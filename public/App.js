import { React } from './React.js';
import Box from './Examples/components/Box.js';
import Counter from './Examples/components/Counter.js';
import Label from './Examples/components/Label.js';
import YetAnotherBox from './Examples/components/YetAnotherBox.js';
var crearRoot = function crearRoot() {
  return /*#__PURE__*/React.createElement("div", {
    style: "background: salmon"
  }, /*#__PURE__*/React.createElement("h1", null, "Construyendo React de manera casera"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement("h1", null, "Construyendo React de manera casera"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement("h1", null, "Construyendo React de manera casera"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), /*#__PURE__*/React.createElement(Label, null), /*#__PURE__*/React.createElement(Box, null), /*#__PURE__*/React.createElement(YetAnotherBox, null), /*#__PURE__*/React.createElement(Counter, null));
};
var container = document.getElementById('root');
React.render(crearRoot(), container);