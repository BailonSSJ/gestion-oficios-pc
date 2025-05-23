// App.jsx o Routes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registro from './pages/Registro';       // ajusta la ruta según tu estructura
import OficiosPanel from "./components/OficiosPanel";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/panel" element={<OficiosPanel />} /> {/* ✅ Aquí defines la ruta */}
      </Routes>
    </Router>
  );
}

export default App;
