import express from "express";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ importante para recibir formularios con archivos

const upload = multer({ dest: "uploads/" });

const keyFile = JSON.parse(fs.readFileSync(path.join(__dirname, "gestion.json"), "utf-8"));
const auth = new google.auth.GoogleAuth({
  credentials: keyFile,
  scopes: ["https://www.googleapis.com/auth/drive.file"]
});
const drive = google.drive({ version: "v3", auth });

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-service-account.json"), "utf-8"));
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});
const db = admin.firestore();

const uploadFileToDrive = async (filePath, fileName, mimeType) => {
  const fileMetadata = {
    name: fileName,
    parents: ["1TjWIbuhZDtE4_Dry8mqQ3cFAcoD1iDcl"],
  };
  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return file.data;
};

app.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No se ha subido ningún archivo" });

    const filePath = path.join(__dirname, req.file.path);
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    const fileData = await uploadFileToDrive(filePath, fileName, mimeType);
    fs.unlinkSync(filePath); // Eliminar archivo local

    const nuevoRegistro = {
      folio: req.body.folio || "",
      asunto: req.body.asunto || "",
      fechaRecibo: req.body.fechaRecibo || "",
      contenido: req.body.contenido || "",
      persona: req.body.persona || "",
      enlacePDF: fileData.webViewLink,
      estatus: "Pendiente",
      comentarios: "",
      motivoRechazo: "",
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

app.get("/", (req, res) => {
  res.send("Servidor Backend funcionando correctamente");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
