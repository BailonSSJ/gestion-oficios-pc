import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faFloppyDisk,
  faTrash,
  faArrowLeft,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../styles/OficiosPanel.css';

const OficiosPanel = () => {
  const [oficios, setOficios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [oficioEditado, setOficioEditado] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [filtroEstatus, setFiltroEstatus] = useState('Últimos 5');
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const navigate = useNavigate();

  const obtenerOficios = async (filtro = 'Últimos 5') => {
    try {
      let q;

      if (filtro === 'Últimos 5') {
        q = query(collection(db, 'oficios'), orderBy('timestamp', 'desc'), limit(5));
      } else {
        q = query(collection(db, 'oficios'), orderBy('timestamp', 'desc'));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOficios(data);
    } catch (error) {
      console.error('Error al obtener oficios:', error);
    }
  };

  useEffect(() => {
    obtenerOficios(filtroEstatus);
    setResultadoBusqueda(null);
    setErrorBusqueda('');
  }, [filtroEstatus]);

  const handleEditar = (oficio) => {
    setEditandoId(oficio.id);
    setOficioEditado({ ...oficio });
  };

  const handleGuardar = async () => {
    if (oficioEditado.estatus === 'Rechazado' && !oficioEditado.motivoRechazo) {
      alert('Debes seleccionar un motivo de rechazo.');
      return;
    }

    try {
      const oficioRef = doc(db, 'oficios', editandoId);
      await updateDoc(oficioRef, {
        ...oficioEditado,
        motivoRechazo: oficioEditado.estatus === 'Rechazado' ? oficioEditado.motivoRechazo || '' : null,
        timestamp: serverTimestamp(),
      });

      setEditandoId(null);
      setOficioEditado({});
      obtenerOficios(filtroEstatus);
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
    }
  };

  const handleEliminar = async (id) => {
    const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este oficio?');
    if (!confirmacion) return;

    try {
      await deleteDoc(doc(db, 'oficios', id));
      setOficios(prev => prev.filter(of => of.id !== id));
    } catch (error) {
      console.error('Error al eliminar el oficio:', error);
    }
  };

  const handleCambioCampo = (campo, valor) => {
    setOficioEditado(prev => {
      if (campo === 'estatus' && valor !== 'Rechazado') {
        return { ...prev, [campo]: valor, motivoRechazo: '' };
      }
      return { ...prev, [campo]: valor };
    });
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    let fecha;

    if (typeof fechaStr === 'object' && fechaStr.seconds) {
      fecha = new Date(fechaStr.seconds * 1000);
    } else {
      fecha = new Date(fechaStr);
    }

    if (isNaN(fecha.getTime())) return 'Fecha inválida';

    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const buscarPorFolio = () => {
    if (!busqueda.trim()) {
      setResultadoBusqueda(null);
      setErrorBusqueda('');
      return;
    }

    const encontrado = oficios.find(of => of.folio?.toLowerCase() === busqueda.toLowerCase());
    if (encontrado) {
      setResultadoBusqueda(encontrado);
      setErrorBusqueda('');
    } else {
      setResultadoBusqueda(null);
      setErrorBusqueda('Folio no encontrado');
    }
  };

  const listaFiltrada = resultadoBusqueda
    ? [resultadoBusqueda]
    : filtroEstatus === 'Todos'
    ? oficios
    : filtroEstatus === 'Últimos 5'
    ? oficios
    : oficios.filter(of => {
        const estatus = of.estatus;
        return (
          estatus === filtroEstatus ||
          (filtroEstatus === 'En Proceso' && estatus === 'Pendiente') ||
          (filtroEstatus === 'Autorizado' && estatus === 'Aceptado')
        );
      });

  const mostrarEstatus = (estatus) => {
    if (estatus === 'Pendiente') return 'En Proceso';
    if (estatus === 'Aceptado') return 'Autorizado';
    return estatus;
  };

  return (
    <div className="contenedor-principal">
      <button className="volver-button" onClick={() => navigate('/')}>
        <FontAwesomeIcon icon={faArrowLeft} /> Volver a Registro
      </button>

      <h2>Panel de Oficios</h2>

      <div className="busqueda-container">
        <input
          type="text"
          placeholder="Buscar por folio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') buscarPorFolio(); }}
        />
        <button onClick={buscarPorFolio} className="buscar-button">
          <FontAwesomeIcon icon={faSearch} /> Buscar
        </button>

        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="filtro-select"
        >
          <option value="Últimos 5">Últimos 5</option>
          <option value="Todos">Todos</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Autorizado">Autorizado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
      </div>

      {errorBusqueda && (
        <div className="error-busqueda" style={{ color: 'red', marginBottom: '10px' }}>
          {errorBusqueda}
        </div>
      )}

      {listaFiltrada.map((oficio) => (
        <div key={oficio.id} className="oficio-panel">
          {oficio.enlacePDF && (
            <a
              className="ver-pdf-button"
              href={oficio.enlacePDF}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver PDF
            </a>
          )}

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

          <label>Fecha de última actualización:</label>
          <div className="field-text">
            {oficio.timestamp ? formatearFecha(oficio.timestamp) : 'No disponible'}
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

          <label>Contenido (Pendiente a atender):</label>
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

          {editandoId === oficio.id ? (
            <>
              <label>Estatus:</label>
              <select
                value={oficioEditado.estatus || 'Pendiente'}
                onChange={(e) => handleCambioCampo('estatus', e.target.value)}
              >
                <option value="Pendiente">En Proceso</option>
                <option value="Aceptado">Autorizado</option>
                <option value="Rechazado">Rechazado</option>
              </select>

              {oficioEditado.estatus === 'Rechazado' && (
                <>
                  <label>Motivo de Rechazo:</label>
                  <select
                    value={oficioEditado.motivoRechazo || ''}
                    onChange={(e) => handleCambioCampo('motivoRechazo', e.target.value)}
                  >
                    <option value="">Seleccionar motivo</option>
                    <option value="Fuera de competencia">Fuera de competencia</option>
                    <option value="No cumplir requisitos">No cumplir requisitos</option>
                    <option value="Mal proceso">Mal proceso</option>
                  </select>
                </>
              )}
            </>
          ) : (
            <>
              <label>Estatus:</label>
              <div className={`estatus estatus-${oficio.estatus?.toLowerCase()}`}>
                {mostrarEstatus(oficio.estatus)}
              </div>

              {oficio.estatus === 'Rechazado' && (
                <>
                  <label>Motivo de Rechazo:</label>
                  <div className="field-text">{oficio.motivoRechazo || 'Sin motivo'}</div>
                </>
              )}
            </>
          )}

          {editandoId === oficio.id ? (
            <button onClick={handleGuardar} className="save-button">
              <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
            </button>
          ) : (
            <div className="acciones">
              <button onClick={() => handleEditar(oficio)} className="edit-button">
                <FontAwesomeIcon icon={faPen} /> Editar
              </button>
              <button onClick={() => handleEliminar(oficio.id)} className="delete-button">
                <FontAwesomeIcon icon={faTrash} /> Eliminar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OficiosPanel;
