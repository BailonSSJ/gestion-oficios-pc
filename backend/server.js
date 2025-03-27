const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Configurar variables de entorno
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
