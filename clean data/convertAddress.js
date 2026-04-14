const fs = require("fs");
const path = require("path");
const https = require("https");

const INPUT_PATH = path.join(__dirname, "datasets", "set-1-merged.csv");
const OUTPUT_PATH = path.join(
  __dirname,
  "datasets",
  "set-1-merged-address.csv",
);

// Nominatim allows max 1 request per second
const DELAY_MS = 1100;

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function quoteCsv(value) {
  const str = value == null ? "" : String(value);
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// ── GPS parsing ──────────────────────────────────────────────────────────────

// gps_text format: "Lat: 13.681, Lng: 100.610, Accuracy: 4.9m"
function parseGpsText(gpsText) {
  const latMatch = gpsText.match(/Lat:\s*([-\d.]+)/i);
  const lngMatch = gpsText.match(/Lng:\s*([-\d.]+)/i);
  if (!latMatch || !lngMatch) return null;
  return { lat: latMatch[1], lng: lngMatch[1] };
}

// ── Nominatim reverse geocode ────────────────────────────────────────────────

function fetchAddress(lat, lng) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=${lat}&lon=${lng}`;
    const options = {
      headers: {
        "User-Agent": "wifi-detection-address-converter",
        "Accept-Language": "en-US,en;q=0.9",
      },
    };
    https
      .get(url, options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (json.error) {
              resolve("");
              return;
            }
            const a = json.address ?? {};
            const parts = [
              a.house_number ? `${a.house_number} ${a.road ?? a.pedestrian ?? ""}`.trim() : (a.road ?? a.pedestrian),
              a.building ?? a.amenity,
              a.suburb ?? a.neighbourhood ?? a.quarter,
              a.city ?? a.town ?? a.village ?? a.county,
              a.country,
            ].filter(Boolean);
            resolve(
              parts.length > 0 ? parts.join(" - ") : (json.display_name ?? ""),
            );
          } catch {
            resolve("");
          }
        });
      })
      .on("error", () => resolve(""));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const lines = raw.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.replace(/^"|"$/g, ""));
    return headers.reduce((obj, h, i) => {
      obj[h] = values[i] ?? "";
      return obj;
    }, {});
  });

  // Collect unique coordinates to minimise API calls
  const coordCache = new Map(); // "lat,lng" -> address
  const uniqueCoords = [];
  for (const row of rows) {
    const coords = parseGpsText(row.gps_text ?? "");
    if (!coords) continue;
    const key = `${coords.lat},${coords.lng}`;
    if (!coordCache.has(key)) {
      coordCache.set(key, null);
      uniqueCoords.push({ key, ...coords });
    }
  }

  console.log(
    `Fetching addresses for ${uniqueCoords.length} unique coordinates...`,
  );

  for (let i = 0; i < uniqueCoords.length; i++) {
    const { key, lat, lng } = uniqueCoords[i];
    process.stdout.write(`  [${i + 1}/${uniqueCoords.length}] ${key} ... `);
    const address = await fetchAddress(lat, lng);
    coordCache.set(key, address);
    console.log(address || "(no result)");
    if (i < uniqueCoords.length - 1) await sleep(DELAY_MS);
  }

  // Build output CSV with new "address" column
  const outHeaders = [...headers, "address"];
  const outLines = [
    outHeaders.map(quoteCsv).join(","),
    ...rows.map((row) => {
      const coords = parseGpsText(row.gps_text ?? "");
      const address = coords
        ? (coordCache.get(
            `${coords.lat},${coords.lng}`,
          ) ?? "")
        : "";
      return outHeaders
        .map((h) => quoteCsv(h === "address" ? address : row[h]))
        .join(",");
    }),
  ];

  fs.writeFileSync(OUTPUT_PATH, outLines.join("\r\n"), "utf8");
  console.log(`\nDone! Written ${rows.length} rows to:\n  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
