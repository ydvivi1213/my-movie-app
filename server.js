import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import roomsRouter from './src/routes/rooms.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomsRouter);

// Serve the React build in production
app.use(express.static(join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MovieTime server running at http://localhost:${PORT}`);
});
