// Se transpila como
// React.createElement("div", {
//   style: {
//     color: "white",
//     backgroundColor: "black",
//     padding: "20px"
//   }
// }, "Styled Box");

//Nota -> Aca se ve del porque los styled, cuando son inline, son pasados como style={{}}, con doble llave

const StyledComponent = () => {
  return <div style={{
    color: "blue",
    backgroundColor: "white",
    padding: "20px"
  }}>Just a big Blue styled box</div>;
};

export default StyledComponent;
