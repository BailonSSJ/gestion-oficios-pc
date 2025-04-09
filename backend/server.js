import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import mime from 'mime-types';
import cors from 'cors';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' }); // Archivos temporales

app.use(cors({ origin: 'http://localhost:5173', methods: ['POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

const DRIVE_FOLDER_ID = "1TjWIbuhZDtE4_Dry8mqQ3cFAcoD1iDcl"; // Tu carpeta de destino

// Autenticación con Google
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(fs.readFileSync('gestion.json', 'utf-8')),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Ruta para subir archivo a Google Drive
app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se ha enviado ningún archivo.' });
  }

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = mime.lookup(filePath) || 'application/pdf';

    const fileMetadata = {
      name: originalName,
      parents: [DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    fs.unlinkSync(filePath); // Borrar archivo temporal

    const fileId = response.data.id;
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    // Enviar metadatos también (folio, asunto, etc.)
    const { folio, asunto, fechaRecibo, contenido, persona } = req.body;

    console.log("📝 Metadatos recibidos:", { folio, asunto, fechaRecibo, contenido, persona });

    res.json({
      success: true,
      driveUrl: fileUrl,
      fileId,
    });
  } catch (error) {
    console.error('❌ Error al subir el archivo a Google Drive:', error);
    res.status(500).json({ success: false, message: 'Error al subir el archivo a Google Drive.' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
