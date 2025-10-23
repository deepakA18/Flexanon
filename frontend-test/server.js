import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle share links
app.get('/s/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'share.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('FlexAnon Test Frontend');
  console.log('======================');
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`Share viewer: http://localhost:${PORT}/s/TOKEN_ID`);
  console.log('');
  console.log('Instructions:');
  console.log('1. Make sure backend is running on port 3001');
  console.log('2. Install Phantom wallet browser extension');
  console.log('3. Switch Phantom to Devnet');
  console.log('4. Open http://localhost:3000 in your browser');
  console.log('5. Click "Connect Wallet"');
  console.log('6. Click "Generate Share Link"');
  console.log('7. Open the generated link to view shared portfolio');
  console.log('');
});
