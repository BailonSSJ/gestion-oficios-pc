const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const mime = require('mime-types');

const app = express();
const PORT = 5000;

// 🔹 Habilitar CORS para permitir peticiones desde el frontend
app.use(cors({
    origin: 'http://localhost:5173', // Permitir solicitudes solo desde el frontend
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

// Configurar middleware para subir archivos
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

// Crear la carpeta 'uploads' si no existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 🔹 Configurar autenticación con Google Drive
const auth = new google.auth.GoogleAuth({
    keyFile: "gestion.json",  // Asegúrate de que este archivo exista
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

// 🔹 ID de la carpeta en Google Drive donde se guardarán los archivos
const DRIVE_FOLDER_ID = "1TjWIbuhZDtE4_Dry8mqQ3cFAcoD1iDcl"; // Reemplázalo con tu Folder ID de Google Drive

// 🔹 Función para subir archivos a Google Drive
async function uploadToGoogleDrive(filePath, fileName) {
    try {
        const fileMetadata = {
            name: fileName,
            parents: [DRIVE_FOLDER_ID], // Guardar en la carpeta específica
        };
        const media = {
            mimeType: mime.lookup(filePath),
            body: fs.createReadStream(filePath),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        console.log(`📂 Archivo subido a Drive con ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error("❌ Error al subir el archivo a Google Drive:", error);
        throw new Error("Error al subir el archivo a Google Drive.");
    }
}

// 🔹 Ruta para recibir y subir archivos
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.pdf) {
            return res.status(400).json({ success: false, message: "No se recibió ningún archivo." });
        }

        const archivo = req.files.pdf;
        console.log("📂 Archivo recibido:", archivo.name);

        const uploadPath = path.join(uploadDir, archivo.name);
        await archivo.mv(uploadPath);
        console.log("✅ Archivo guardado en:", uploadPath);

        // 🔹 Subir archivo a Google Drive
        const fileId = await uploadToGoogleDrive(uploadPath, archivo.name);

        // 🔹 Enviar respuesta con el enlace al archivo en Google Drive
        res.json({
            success: true,
            message: "Archivo subido correctamente.",
            fileId: fileId,
            driveUrl: `https://drive.google.com/file/d/${fileId}/view`,
        });

    } catch (error) {
        console.error("❌ Error en la subida del archivo:", error);
        res.status(500).json({ success: false, message: "Error en el servidor." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
