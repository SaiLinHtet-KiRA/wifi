const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'out-datasets', 'result.csv');
const outputPath = path.join(__dirname, 'cleaned_output.csv');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

const header = parseCSVLine(lines[0]);
const bssidIndex = header.indexOf('bssid');
const gpsTextIndex = header.indexOf('gps_text');

function parseGPS(gpsText) {
  if (!gpsText) return { lat: '', lng: '' };
  const latMatch = gpsText.match(/Lat:\s*([0-9.-]+)/);
  const lngMatch = gpsText.match(/Lng:\s*([0-9.-]+)/);
  return {
    lat: latMatch ? latMatch[1] : '',
    lng: lngMatch ? lngMatch[1] : ''
  };
}

const outputLines = ['bssid,lat,lng'];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const values = parseCSVLine(lines[i]);
  const bssid = values[bssidIndex] || '';
  const gpsText = values[gpsTextIndex] || '';
  const { lat, lng } = parseGPS(gpsText);
  
  outputLines.push(`${bssid},${lat},${lng}`);
}

fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');
console.log(`Cleaned data saved to: ${outputPath}`);