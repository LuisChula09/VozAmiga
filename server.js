import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import chatHandler from './api/chat.js';

dotenv.config(); // Carga variables de entorno (.env)

const app = express();
const PORT = 3000;
app.use((req, res, next) => {
  console.log(`Recibida petición: ${req.method} ${req.url}`);
  next();
});
// Middlewares clave
app.use(cors());          // Permite peticiones desde el frontend
app.use(express.json());  // Para parsear JSON

// Ruta del chatbot
app.post('/api/chat', chatHandler);

// Sirve archivos estáticos (HTML, CSS, JS)
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`✅ Servidor backend en http://localhost:${PORT}`);
});