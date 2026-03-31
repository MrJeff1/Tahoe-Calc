import Calculator from "./Calculator";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, #2a2a2a 0%, #111 100%)",
      }}
    >
      <Calculator />
    </div>
  );
}

export default App;
