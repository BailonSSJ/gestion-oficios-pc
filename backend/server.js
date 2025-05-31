import express from "express";
import { google } from "googleapis";
import cors from "cors";
import multer from "multer";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer en modo memoria
const upload = multer({ storage: multer.memoryStorage() });

// Leer credenciales Google Drive
const keyFile = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS_STRING);

const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

// Firebase
const firebaseConfig = JSON.parse(process.env.FIREBASE_CREDENTIALS_STRING);

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});
const db = admin.firestore();

// Subir archivo a Drive desde buffer (no usa archivo local)
async function uploadFileToDriveFromBuffer(buffer, fileName, mimeType) {
  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || "1TjWIbuhZDtE4_Dry8mqQ3cFAcoD1iDcl"],
  };
  const media = {
    mimeType,
   body: ReadableFromBuffer(buffer),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return file.data;
}

// Utilidad para convertir buffer a stream
import { Readable } from "stream";
function ReadableFromBuffer(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Ruta POST
app.post("/subir", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se ha subido ningún archivo" });
    }

    const buffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Subir a Drive usando el buffer directamente
    const fileData = await uploadFileToDriveFromBuffer(buffer, fileName, mimeType);

    const nuevoRegistro = {
      folio: req.body.folio || "",
      asunto: req.body.asunto || "",
      fechaRecibo: req.body.fechaRecibo || "",
      contenido: req.body.contenido || "",
      persona: req.body.persona || "",
      enlacePDF: fileData.webViewLink,
      estatus: "En proceso",
      comentarios: "",
      motivoRechazo: "",
      timestamp: new Date(),
    };

    await db.collection("oficios").add(nuevoRegistro);

    res.json({
      success: true,
      message: "Archivo subido y datos registrados correctamente",
      fileId: fileData.id,
      fileLink: fileData.webViewLink,
    });
  } catch (error) {
    console.error("Error en /subir:", error);
    res.status(500).json({ success: false, message: "Error al subir archivo o guardar datos" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor Backend funcionando correctamente");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
