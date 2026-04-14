const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "datasets", "set-1.csv");

fs.readFile(csvPath, "utf8", (err, data) => {
  if (err) {
    console.error("Failed to read CSV:", err);
    return;
  }

  const parseCsvLine = (line) => {
    const cells = [];
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

  const lines = data.trim().split(/\r?\n/);
  const cleanValue = (value) => value.replace(/^"|"$/g, "");
  const headers = parseCsvLine(lines[0]).map(cleanValue);
  const objects = lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map(cleanValue);
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] ?? "";
      return obj;
    }, {});
  });

  const mergedByBssid = new Map();
  objects.forEach((obj) => {
    const bssid = obj.bssid?.toLowerCase().trim();
    if (!bssid) {
      return;
    }

    if (!mergedByBssid.has(bssid)) {
      mergedByBssid.set(bssid, { ...obj, merged_count: 1 });
      return;
    }

    const existing = mergedByBssid.get(bssid);
    existing.merged_count = (existing.merged_count || 1) + 1;

    headers.forEach((field) => {
      if (!existing[field] && obj[field]) {
        existing[field] = obj[field];
      }
    });
  });

  const outHeaders = [...headers, "merged_count"];
  const quoteCsv = (value) => {
    const str = value == null ? "" : String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const mergedCsv = [
    outHeaders.map(quoteCsv).join(","),
    ...Array.from(mergedByBssid.values()).map((obj) =>
      outHeaders.map((header) => quoteCsv(obj[header])).join(","),
    ),
  ].join("\r\n");

  const outPath = path.join(__dirname, "datasets", "set-1-merged.csv");
  fs.writeFile(outPath, mergedCsv, "utf8", (writeErr) => {
    if (writeErr) {
      console.error("Failed to write merged CSV:", writeErr);
      return;
    }
    console.log(
      `Merged ${objects.length} rows into ${mergedByBssid.size} unique BSSID rows.`,
    );
    console.log("Created merged CSV at:", outPath);
  });
});
