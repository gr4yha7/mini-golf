import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ShotValidator } from './validators/shotValidator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const shotValidator = new ShotValidator();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Shot validation endpoint
app.post('/api/validate-shot', (req, res) => {
  const { gameId, power, angle, playerAddress } = req.body;

  const result = shotValidator.validateShot({
    gameId,
    power,
    angle,
    playerAddress
  });

  if (!result.isValid) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ commitment: result.commitment });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    
    // Handle real-time game updates
    if (data.type === 'SHOT_TAKEN') {
      // Broadcast to other players
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 