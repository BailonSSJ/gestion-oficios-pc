import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyAheth-iCGenbU3n68q5PXADt8posrlyug",
  authDomain: "gestion-oficios-pc.firebaseapp.com",
  databaseURL: "https://gestion-oficios-pc-default-rtdb.firebaseio.com",
  projectId: "gestion-oficios-pc",
  storageBucket: "gestion-oficios-pc.firebasestorage.app",
  messagingSenderId: "1012485780559",
  appId: "1:1012485780559:web:fd0e985b31fd2900fea63a"
};

// Inicializa Firebase solo una vez
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const OficiosPanel = () => {
  const [oficios, setOficios] = useState([]);

  useEffect(() => {
    const oficiosRef = ref(database, 'oficios');
    onValue(oficiosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([folio, contenido]) => ({
          folio,
          ...contenido,
        }));
        setOficios(lista);
      } else {
        setOficios([]);
      }
    });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📋 Panel de Oficios</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Asunto</th>
            <th>Persona</th>
            <th>Fecha Recibo</th>
            <th>Estatus</th>
            <th>Comentarios</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {oficios.map((oficio) => (
            <tr key={oficio.folio}>
              <td>{oficio.folio}</td>
              <td>{oficio.asunto}</td>
              <td>{oficio.persona}</td>
              <td>{oficio.fechaRecibo}</td>
              <td>{oficio.estatus}</td>
              <td>{oficio.comentarios}</td>
              <td>
                <a href={oficio.pdfUrl} target="_blank" rel="noopener noreferrer">📄 Ver PDF</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OficiosPanel;
