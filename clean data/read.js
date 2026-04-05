const fs = require("fs");
const path = require("path");

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

const csvPath = path.join(__dirname, "datasets", "set-1-merged.csv");

fs.readFile(csvPath, "utf8", (err, data) => {
  if (err) {
    console.error("Failed to read merged CSV:", err);
    return;
  }

  const lines = data.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const gpsTextIndex = headers.indexOf("gps_text");

  if (gpsTextIndex === -1) {
    console.error("gps_text field not found in headers");
    return;
  }

  console.log("GPS Text fields from set-1-merged.csv (first 100):");
  lines.slice(1, 101).forEach((line) => {
    const values = parseCsvLine(line).map((v) => v.replace(/^"|"$/g, ""));
    let gpsText = values[gpsTextIndex];
    gpsText = gpsText.replace(/, Accuracy: .*/, "");
    console.log(gpsText);
  });
});
