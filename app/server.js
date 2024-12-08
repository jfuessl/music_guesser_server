const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Ordner mit Musikdateien
const MUSIC_DIR = path.join(__dirname, 'music');

// Unterstützte Dateiformate
const SUPPORTED_FORMATS = ['.mp3', '.aac', '.wav', '.flac', '.ogg', '.m3u8'];

// Route für den Musikstream
app.get('/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(MUSIC_DIR, filename);

  // Überprüfen, ob die Datei existiert
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Datei nicht gefunden');
    return;
  }

  // Überprüfen, ob das Dateiformat unterstützt wird
  const ext = path.extname(filename).toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext)) {
    res.status(415).send('Dateiformat wird nicht unterstützt');
    return;
  }

  // Dateigröße ermitteln
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  // Range-Header verarbeiten (für Streaming)
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Prüfen, ob der Range-Bereich gültig ist
    if (start >= fileSize || end >= fileSize) {
      res.status(416).send('Range nicht erfüllbar');
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    // Header für Teil-Content setzen
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': getContentType(ext),
    });

    fileStream.pipe(res);
  } else {
    // Wenn kein Range-Header vorhanden ist, gesamte Datei senden
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': getContentType(ext),
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Funktion, um den passenden Content-Type basierend auf der Dateierweiterung zu bestimmen
function getContentType(ext) {
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.aac': 'audio/aac',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.m3u8': 'application/vnd.apple.mpegurl',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`Musikstream verfügbar unter http://localhost:${PORT}/stream/<filename>`);
});
