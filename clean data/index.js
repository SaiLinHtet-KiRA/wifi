const fs = require("fs");
const path = require("path");
const https = require("https");

const rawDir = path.join(__dirname, "raw-datasets");
const outDir = path.join(__dirname, "out-datasets");
const outFile = path.join(outDir, "result.csv");

const DELAY_MS = 1100;

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function quoteCsv(value) {
  const str = value == null ? "" : String(value);
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

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

function parseGpsText(gpsText) {
  const latMatch = gpsText?.match(/Lat:\s*([-\d.]+)/i);
  const lngMatch = gpsText?.match(/Lng:\s*([-\d.]+)/i);
  if (!latMatch || !lngMatch) return null;
  return { lat: latMatch[1], lng: lngMatch[1] };
}

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
              a.house_number
                ? `${a.house_number} ${a.road ?? a.pedestrian ?? ""}`.trim()
                : a.road ?? a.pedestrian,
              a.building ?? a.amenity,
              a.suburb ?? a.neighbourhood ?? a.quarter,
              a.city ?? a.town ?? a.village ?? a.county,
              a.country,
            ].filter(Boolean);
            resolve(
              parts.length > 0 ? parts.join(" - ") : json.display_name ?? "",
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

async function main() {
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".csv"));

  const bssidMap = new Map();
  const uniqueCoords = new Map();

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());

    const headers = parseCsvLine(lines[0]).map((h) =>
      h.replace(/^"|"$/g, ""),
    );

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]).map((v) =>
        v.replace(/^"|"$/g, ""),
      );
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const bssid = row.bssid;
      if (!bssid) continue;

      if (!bssidMap.has(bssid)) {
        bssidMap.set(bssid, row);
        const coords = parseGpsText(row.gps_text);
        if (coords) {
          const key = `${coords.lat},${coords.lng}`;
          if (!uniqueCoords.has(key)) {
            uniqueCoords.set(key, { lat: coords.lat, lng: coords.lng });
          }
        }
      } else {
        const existing = bssidMap.get(bssid);
        if (parseFloat(row.rssi_dbm) > parseFloat(existing.rssi_dbm)) {
          bssidMap.set(bssid, row);
        }
      }
    }
  }

  console.log(
    `Found ${bssidMap.size} unique BSSIDs, ${uniqueCoords.size} unique coordinates`,
  );

  console.log("Fetching addresses...");
  const coordAddressMap = new Map();
  let idx = 0;
  for (const [key, coords] of uniqueCoords) {
    idx++;
    process.stdout.write(`  [${idx}/${uniqueCoords.size}] ${key} ... `);
    const address = await fetchAddress(coords.lat, coords.lng);
    coordAddressMap.set(key, address);
    console.log(address || "(no result)");
    if (idx < uniqueCoords.size) await sleep(DELAY_MS);
  }

  const headers = [
    "collection_id",
    "username",
    "sample_id",
    "captured_at",
    "gps_text",
    "wifi_count",
    "bssid",
    "ssid",
    "rssi_dbm",
    "frequency_mhz",
    "channel",
    "band",
    "security",
    "wifi_standard",
    "address",
  ];

  const csvContent = [
    headers.map(quoteCsv).join(","),
    ...Array.from(bssidMap.values()).map((row) => {
      const coords = parseGpsText(row.gps_text);
      const address = coords
        ? coordAddressMap.get(`${coords.lat},${coords.lng}`) ?? ""
        : "";
      const values = headers.map((h) => {
        if (h === "address") return quoteCsv(address);
        return quoteCsv(row[h] || "");
      });
      return values.join(",");
    }),
  ].join("\n");

  fs.writeFileSync(outFile, csvContent);

  console.log(
    `Done! Merged ${bssidMap.size} BSSIDs with addresses to ${outFile}`,
  );
}

main();