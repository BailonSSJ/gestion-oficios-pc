// Importaciones necesarias (formato ESM)
import express from "express";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";
import admin from "firebase-admin"; // 👈 Firebase Admin SDK

// Compatibilidad para __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Multer
const upload = multer({ dest: "uploads/" });

// Cargar credenciales de Google Drive
const keyFile = JSON.parse(fs.readFileSync(path.join(__dirname, "gestion.json"), "utf-8"));

// Autenticación Google Drive
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ["https://www.googleapis.com/auth/drive.file"]
});
const drive = google.drive({ version: "v3", auth });

// Inicializar Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-service-account.json"), "utf-8"));
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});
const db = admin.firestore();

// Subida a Google Drive
const uploadFileToDrive = async (filePath, fileName) => {
  const fileMetadata = {
    name: fileName,
    parents: ["1TjWIbuhZDtE4_Dry8mqQ3cFAcoD1iDcl"], // carpeta en tu Drive
  };
  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  // Hacerlo público
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return file.data;
};

// Ruta para recibir formulario + PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No se ha subido ningún archivo" });

    const filePath = path.join(__dirname, req.file.path);
    const fileName = req.file.originalname;

    const fileData = await uploadFileToDrive(filePath, fileName);
    fs.unlinkSync(filePath); // Eliminar archivo local

    // Guardar datos del formulario en Firebase
    const nuevoRegistro = {
      folio: req.body.folio || "",
      asunto: req.body.asunto || "",
      fechaRecibo: req.body.fechaRecibo || "",
      contenido: req.body.contenido || "",
      persona: req.body.persona || "",
      enlacePDF: fileData.webViewLink,
      estatus: "Pendiente",           // ✅ Estado inicial
      comentarios: "",                // ✅ Comentarios opcionales
      motivoRechazo: "",             // ✅ Se llenará si se rechaza
      timestamp: new Date()
    };

    await db.collection("oficios").add(nuevoRegistro);

    res.json({
      success: true,
      message: "Archivo subido y datos registrados correctamente",
      fileId: fileData.id,
      fileLink: fileData.webViewLink
    });

  } catch (error) {
    console.error("Error en /upload:", error);
    res.status(500).json({ success: false, message: "Error al subir archivo o guardar datos" });
  }
});

// Verificación
app.get("/", (req, res) => {
  res.send("Servidor Backend funcionando correctamente");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
