// App.jsx o Main.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Formulario from './pages/Registro';
import OficiosPanel from './components/OficiosPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Formulario />} />
        <Route path="/panel" element={<OficiosPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
