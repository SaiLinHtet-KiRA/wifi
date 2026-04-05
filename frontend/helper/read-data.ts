import { promises as fs } from "fs";
import path from "path";

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
};

const cleanValue = (value: string) => value.replace(/^"|"$/g, "");

const parseGps = (gpsText: string) => {
  const latMatch = gpsText.match(/Lat:\s*([-\d.]+)/);
  const lngMatch = gpsText.match(/Lng:\s*([-\d.]+)/);
  const accMatch = gpsText.match(/Accuracy:\s*([^\s]+)/);
  return {
    lat: latMatch ? parseFloat(latMatch[1]) : null,
    lng: lngMatch ? parseFloat(lngMatch[1]) : null,
    accuracy: accMatch ? accMatch[1] : null,
  };
};

export type CsvRow = Record<string, any>;

export async function readSet1Csv(): Promise<any> {
  const csvPath = path.join(process.cwd(), "data", "set-1.csv");
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0])
    .map(cleanValue)
    .map((h) => (h === "gps_text" ? "gps" : h));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map(cleanValue);
    return headers.reduce<CsvRow>((row, header, index) => {
      const value = values[index] ?? "";
      row[header] = header === "gps" ? parseGps(value) : value;
      return row;
    }, {});
  });
}
