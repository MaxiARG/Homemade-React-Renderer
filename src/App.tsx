import { React } from './React.js';
import Box from './Examples/components/Box.js';
import Counter from './Examples/components/Counter.js';
import Label from './Examples/components/Label.js';
import YetAnotherBox from './Examples/components/YetAnotherBox.js';
import StyledComponent from './Examples/StyledComponent.js';

const crearRoot = () => {
  return (
    <div style="background: salmon">
      <h1>Construyendo React de manera casera</h1>
      <h2 style="text-align:right">Caso de estudio</h2>
      <h2 style="text-align:right">Caso de estudio</h2>
            <h1>Construyendo React de manera casera</h1>
      <h2 style="text-align:right">Caso de estudio</h2>
      <h2 style="text-align:right">Caso de estudio</h2>
            <h1>Construyendo React de manera casera</h1>
      <h2 style="text-align:right">Caso de estudio</h2>
      <h2 style="text-align:right">Caso de estudio</h2>
      <Label theLabel={'Un label pasado por prop'}/>
      <Box />
      <YetAnotherBox/>
      <Counter />
      <StyledComponent />
      <Label theLabel={'Array de elementos'}/>
      {
        [1,2,3].map((elem)=>(<div>{elem}</div>))
      }
    </div>
  );
};

const container = document.getElementById('root');
React.render(crearRoot(), container);
