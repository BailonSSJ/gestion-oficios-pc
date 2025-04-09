import React, { useState, useRef } from 'react';
import axios from 'axios';
import '../styles/Registro.css';

const Registro = () => {
  const [folio, setFolio] = useState('');
  const [asunto, setAsunto] = useState('');
  const [fechaRecibo, setFechaRecibo] = useState('');
  const [contenido, setContenido] = useState('');
  const [persona, setPersona] = useState('');
  const [pdf, setPdf] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const fileInputRef = useRef(null); // Para resetear el input de archivos

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type !== "application/pdf") {
      setMensaje("❌ Solo se permiten archivos en formato PDF.");
      setPdf(null);
      e.target.value = ""; // Reiniciar el input
      return;
    }

    setPdf(file);
    setMensaje(""); // Limpiar mensaje de error si el archivo es válido
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdf) {
        setMensaje("❌ Por favor, selecciona un archivo PDF.");
        return;
    }

    const formData = new FormData();
    formData.append('pdf', pdf);
    formData.append('folio', folio);
    formData.append('asunto', asunto);
    formData.append('fechaRecibo', fechaRecibo);
    formData.append('contenido', contenido);
    formData.append('persona', persona);

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      

        if (response.data.success) {
            setMensaje(`✅ Archivo subido correctamente. 📂\n🔗 Enlace: ${response.data.driveUrl}`);
        } else {
            setMensaje("❌ Error: " + response.data.message);
        }

        // Limpiar formulario después de la subida
        setFolio('');
        setAsunto('');
        setFechaRecibo('');
        setContenido('');
        setPersona('');
        setPdf(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
        setMensaje("❌ Error al subir el archivo.");
        console.error("Error en la subida:", error);
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
          <label>Oficio (PDF):</label>
          <input 
            type="file" 
            name="pdf"  
            accept=".pdf" 
            onChange={handleFileChange} 
            ref={fileInputRef} 
            required 
          />
        </div>
        <button type="submit">Enviar</button>
      </form>
      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
};

export default Registro;
