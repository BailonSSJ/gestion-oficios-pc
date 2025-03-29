// Importaciones necesarias
const express = require("express");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");

// Configurar Express
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Multer para manejar la subida de archivos
const upload = multer({ dest: "uploads/" }); // Carpeta temporal para los archivos

// Cargar las credenciales de Google API
const keyPath = path.join(__dirname, 'google-drive.json');
const keyFile = require(keyPath);

// Configuración de Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ["https://www.googleapis.com/auth/drive.file"]
});

const drive = google.drive({ version: "v3", auth });

// Función para subir un archivo a Google Drive
const uploadFileToDrive = async (filePath, fileName) => {
  const fileMetadata = {
    name: fileName,
    parents: ['root'],  // Cambia esto si quieres subirlo a una carpeta específica en Drive
  };
  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(filePath)
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink"
    });
    return file.data;
  } catch (error) {
    console.error("Error al subir el archivo a Google Drive", error);
    throw error;
  }
};
// Ruta para manejar la subida de archivos PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se ha subido ningún archivo" });
    }

    const filePath = path.join(__dirname, req.file.path);
    const fileName = req.file.originalname;

    const fileData = await uploadFileToDrive(filePath, fileName);

    // Eliminar archivo temporal después de subirlo
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "Archivo subido correctamente",
      fileId: fileData.id,
      fileLink: fileData.webViewLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al subir el archivo" });
  }
});

// Ruta raíz, para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("Servidor de Backend en funcionamiento");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
