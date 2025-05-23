import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faFloppyDisk, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../styles/OficiosPanel.css';

const OficiosPanel = () => {
  const [oficios, setOficios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [oficioEditado, setOficioEditado] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerOficios = async () => {
      const snapshot = await getDocs(collection(db, 'oficios'));
      const oficiosData = snapshot.docs.map(doc => ({
        id: doc.id,           // ID generado por Firestore (no modificar)
        ...doc.data()         // Aquí debe existir un campo 'folio'
      }));
      setOficios(oficiosData);
    };

    obtenerOficios();
  }, []);

  const handleEditar = (oficio) => {
    setEditandoId(oficio.id);
    setOficioEditado({ ...oficio });
  };

  const handleGuardar = async () => {
    try {
      const oficioRef = doc(db, 'oficios', editandoId);
      // Guardamos la info editada, incluyendo folio pero NO modificamos el ID
      await updateDoc(oficioRef, {
        folio: oficioEditado.folio,
        persona: oficioEditado.persona,
        asunto: oficioEditado.asunto,
        contenido: oficioEditado.contenido,
        comentarios: oficioEditado.comentarios,
        estatus: oficioEditado.estatus,
        motivoRechazo: oficioEditado.motivoRechazo || null,
        fechaRecibo: oficioEditado.fechaRecibo || null,
      });

      setOficios((prevOficios) =>
        prevOficios.map((item) =>
          item.id === editandoId ? { ...item, ...oficioEditado } : item
        )
      );

      setEditandoId(null);
      setOficioEditado({});
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
    }
  };

  const handleEliminar = async (id) => {
    const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este oficio?');
    if (!confirmacion) return;

    try {
      await deleteDoc(doc(db, 'oficios', id));
      setOficios((prevOficios) => prevOficios.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error al eliminar el oficio:', error);
    }
  };

  const handleCambioCampo = (campo, valor) => {
    setOficioEditado((prev) => ({ ...prev, [campo]: valor }));
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <button className="volver-button" onClick={() => navigate('/')}>
        <FontAwesomeIcon icon={faArrowLeft} /> Volver a Registro
      </button>

      <h2>Panel de Oficios</h2>
      {oficios.map((oficio) => (
        <div key={oficio.id} className="oficio-panel">

          <label>Folio:</label>
          {editandoId === oficio.id ? (
            <input
              type="text"
              value={oficioEditado.folio || ''}
              onChange={(e) => handleCambioCampo('folio', e.target.value)}
            />
          ) : (
            <div className="field-text">{oficio.folio || 'Sin folio'}</div>
          )}

          <label>Fecha de Recibo:</label>
          <div className="field-text">
            {oficio.fechaRecibo ? formatearFecha(oficio.fechaRecibo) : 'Sin fecha'}
          </div>

          <label>Persona que recibe:</label>
          {editandoId === oficio.id ? (
            <input
              type="text"
              value={oficioEditado.persona || ''}
              onChange={(e) => handleCambioCampo('persona', e.target.value)}
            />
          ) : (
            <div className="field-text">{oficio.persona || 'No registrado'}</div>
          )}

          <label>Asunto:</label>
          {editandoId === oficio.id ? (
            <input
              type="text"
              value={oficioEditado.asunto || ''}
              onChange={(e) => handleCambioCampo('asunto', e.target.value)}
            />
          ) : (
            <div className="field-text">{oficio.asunto || 'Sin asunto'}</div>
          )}

          <label>Contenido:</label>
          {editandoId === oficio.id ? (
            <textarea
              rows="3"
              value={oficioEditado.contenido || ''}
              onChange={(e) => handleCambioCampo('contenido', e.target.value)}
            />
          ) : (
            <div className="field-text">{oficio.contenido || 'Sin contenido'}</div>
          )}

          <label>Comentarios:</label>
          {editandoId === oficio.id ? (
            <textarea
              rows="3"
              value={oficioEditado.comentarios || ''}
              onChange={(e) => handleCambioCampo('comentarios', e.target.value)}
            />
          ) : (
            <div className="field-text">{oficio.comentarios || 'Sin comentarios'}</div>
          )}

          <label>Estatus:</label>
          {editandoId === oficio.id ? (
            <select
              value={oficioEditado.estatus || 'Pendiente'}
              onChange={(e) => handleCambioCampo('estatus', e.target.value)}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          ) : (
            <div className="field-text">{oficio.estatus || 'Pendiente'}</div>
          )}

          {editandoId === oficio.id && oficioEditado.estatus === 'Rechazado' && (
            <>
              <label>Motivo de Rechazo:</label>
              <select
                value={oficioEditado.motivoRechazo || ''}
                onChange={(e) => handleCambioCampo('motivoRechazo', e.target.value)}
              >
                <option value="">Seleccione un motivo</option>
                <option value="Fuera de competencia">Fuera de competencia</option>
                <option value="No cumple requisitos">No cumple requisitos</option>
                <option value="Mal proceso">Mal proceso</option>
              </select>
            </>
          )}

          {editandoId !== oficio.id && oficio.estatus === 'Rechazado' && (
            <>
              <label>Motivo de Rechazo:</label>
              <div className="field-text">
                {oficio.motivoRechazo || 'No especificado'}
              </div>
            </>
          )}

          <div className="btns-container">
            {editandoId === oficio.id ? (
              <>
                <button className="save-button" onClick={handleGuardar}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
                </button>
                <button className="delete-button" onClick={() => handleEliminar(oficio.id)}>
                  <FontAwesomeIcon icon={faTrash} /> Eliminar
                </button>
              </>
            ) : (
              <>
                <button className="edit-button" onClick={() => handleEditar(oficio)}>
                  <FontAwesomeIcon icon={faPen} /> Editar
                </button>
                <button className="delete-button" onClick={() => handleEliminar(oficio.id)}>
                  <FontAwesomeIcon icon={faTrash} /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OficiosPanel;
