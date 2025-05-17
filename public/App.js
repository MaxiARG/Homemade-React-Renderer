import { Dune } from './Dune.js';
import Box from './Examples/components/Box.js';
import Label from './Examples/components/Label.js';
var crearRoot = function crearRoot() {
  return Dune.createElement("div", {
    style: "background: salmon"
  }, Dune.createElement("h1", null, "Construyendo React de manera casera"), Dune.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"), Dune.createElement(Label, null), Dune.createElement(Box, null));
};
var container = document.getElementById('root');
Dune.render(crearRoot(), container);