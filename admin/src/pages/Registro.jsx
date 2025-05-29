import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Registro.css';

const Registro = () => {
  const [folio, setFolio] = useState('');
  const [asunto, setAsunto] = useState('');
  const [fechaRecibo, setFechaRecibo] = useState('');
  const [contenido, setContenido] = useState('');
  const [persona, setPersona] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!archivo) {
      setMensaje("Por favor, selecciona un archivo PDF o una imagen.");
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('folio', folio);
    formData.append('asunto', asunto);
    formData.append('fechaRecibo', fechaRecibo);
    formData.append('contenido', contenido);
    formData.append('persona', persona);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMensaje("Archivo subido correctamente.");
      } else {
        setMensaje("Error: " + response.data.message);
      }

      // Limpiar campos
      setFolio('');
      setAsunto('');
      setFechaRecibo('');
      setContenido('');
      setPersona('');
      setArchivo(null);
    } catch (error) {
      setMensaje("Error al subir el archivo.");
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      <h2>Formulario de Registro</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Folio (En caso de tenerlo):</label>
          <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} />
        </div>
        <div>
          <label>Asunto:</label>
          <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} required />
        </div>
        <div>
          <label>Fecha de Recibo:</label>
          <input type="date" value={fechaRecibo} onChange={(e) => setFechaRecibo(e.target.value)} required />
        </div>
        <div>
          <label>Contenido (Pendiente a atender):</label>
          <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} required />
        </div>
        <div>
          <label>Persona que recibe:</label>
          <input type="text" value={persona} onChange={(e) => setPersona(e.target.value)} required />
        </div>
        <div>
          <label>Oficio (PDF o imagen):</label>
          <input type="file" accept=".pdf,image/*" onChange={handleFileChange} required />
        </div>
        <button type="submit">Enviar</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <button onClick={() => navigate('/panel')} style={{ marginTop: '1rem' }}>
        Ir al Panel de Oficios
      </button>
    </div>
  );
};

export default Registro;
