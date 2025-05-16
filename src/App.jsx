import {Dune} from './index.js'

const crearRoot = () => {
  return(
  <div style="background: salmon">
    <h1>Construyendo React de manera casera</h1>
    <h2 style="text-align:right">Caso de estudio</h2>
  </div>
)}

const container = document.getElementById("root");
Dune.render(crearRoot(), container); 