import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function OficiosPanel() {
  const [oficios, setOficios] = useState([]);

  useEffect(() => {
    const obtenerOficios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'oficios'));
        const lista = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setOficios(lista);
      } catch (error) {
        console.error("Error al obtener oficios:", error);
      }
    };

    obtenerOficios();
  }, []);

  const handleChange = (id, campo, valor) => {
    setOficios((prev) =>
      prev.map((oficio) =>
        oficio.id === id ? { ...oficio, [campo]: valor } : oficio
      )
    );
  };

  const handleGuardar = async (id, oficio) => {
    try {
      const oficioRef = doc(db, 'oficios', id);
      await updateDoc(oficioRef, {
        estatus: oficio.estatus,
        comentarios: oficio.comentarios || '',
        motivoRechazo: oficio.motivoRechazo || ''
      });
      alert("Actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  return (
    <div>
      <h2>Panel de Control de Oficios</h2>
      {oficios.map((oficio) => (
        <div key={oficio.id} className="oficio-card">
          <h3>{oficio.folio} - {oficio.asunto}</h3>
          <p>Persona: {oficio.persona}</p>
          <p>Contenido: {oficio.contenido}</p>

          {/* Estatus */}
          <label>Estatus: </label>
          <select
            value={oficio.estatus}
            onChange={(e) => handleChange(oficio.id, "estatus", e.target.value)}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Aceptado">Aceptado</option>
            <option value="Rechazado">Rechazado</option>
          </select>

          {/* Motivo Rechazo */}
          {oficio.estatus === "Rechazado" && (
            <>
              <label>Motivo de Rechazo:</label>
              <select
                value={oficio.motivoRechazo || ""}
                onChange={(e) =>
                  handleChange(oficio.id, "motivoRechazo", e.target.value)
                }
              >
                <option value="">Selecciona un motivo</option>
                <option value="Información incompleta">Información incompleta</option>
                <option value="Fuera de competencia">Fuera de competencia</option>
                <option value="No aplica">No aplica</option>
              </select>
            </>
          )}

          {/* Comentarios */}
          <label>Comentarios:</label>
          <textarea
            rows={2}
            value={oficio.comentarios || ""}
            onChange={(e) =>
              handleChange(oficio.id, "comentarios", e.target.value)
            }
          />

          <button onClick={() => handleGuardar(oficio.id, oficio)}>Guardar Cambios</button>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default OficiosPanel;

