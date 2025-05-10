const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Ścieżka do katalogu ikon
const iconDir = path.join(__dirname, 'images', 'icons');

// Sprawdź, czy katalog istnieje, jeśli nie - utwórz go
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Rozmiary ikon
const sizes = [72, 96, 128, 144, 192, 512];

// Funkcja tworząca ikonę w określonym rozmiarze
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Tło
  ctx.fillStyle = '#4285f4'; // Niebieski kolor tła
  ctx.fillRect(0, 0, size, size);
  
  // Biały okrąg wewnętrzny
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Symbol glukometru (kształt kropli)
  ctx.fillStyle = '#e74c3c'; // Czerwony
  ctx.beginPath();
  ctx.moveTo(size/2, size * 0.3);
  ctx.quadraticCurveTo(size * 0.7, size * 0.5, size/2, size * 0.7);
  ctx.quadraticCurveTo(size * 0.3, size * 0.5, size/2, size * 0.3);
  ctx.fill();
  
  // Kreska na glukometrze
  const lineWidth = Math.max(2, size * 0.02);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(size/2 - size * 0.1, size * 0.5);
  ctx.lineTo(size/2 + size * 0.1, size * 0.5);
  ctx.stroke();
  
  // Zapisz do pliku
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(iconDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Wygenerowano ikonę ${size}x${size}px`);
}

// Wygeneruj ikony we wszystkich rozmiarach
console.log('Rozpoczynam generowanie ikon...');
sizes.forEach(size => createIcon(size));
console.log('Generowanie ikon zakończone!'); 