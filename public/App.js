import { Dune } from './index.js';
var crearRoot = function crearRoot() {
  return Dune.createElement("div", {
    style: "background: salmon"
  }, Dune.createElement("h1", null, "Construyendo React de manera casera"), Dune.createElement("h2", {
    style: "text-align:right"
  }, "Caso de estudio"));
};
var container = document.getElementById("root");
Dune.render(crearRoot(), container);