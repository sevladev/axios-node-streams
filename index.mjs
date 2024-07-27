import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Transform } from "stream";
import { pipeline } from "stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = axios.create({
  baseURL: "https://randomuser.me/api",
  responseType: "stream",
});

const flattenObject = (obj, parent = "", res = {}) => {
  for (let key in obj) {
    const propName = parent ? parent + "." + key : key;
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

const json2csv = () => {
  let jsonBuffer = "";

  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, _, callback) {
      jsonBuffer += chunk.toString();
      callback();
    },
    flush(callback) {
      try {
        const json = JSON.parse(jsonBuffer);
        const results = json.results;

        if (results.length > 0) {
          const headers = [];
          const rows = [];

          results.forEach((result) => {
            const flatResult = flattenObject(result);
            rows.push(flatResult);

            Object.keys(flatResult).forEach((key) => {
              if (!headers.includes(key)) {
                headers.push(key);
              }
            });
          });

          this.push(headers.join(",") + "\n");

          rows.forEach((row) => {
            const rowValues = headers.map((header) => row[header] || "");
            this.push(rowValues.join(",") + "\n");
          });
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
};

(async () => {
  try {
    const start = new Date().getTime();

    const response = await client.get("?results=5000");

    const outputPath = path.resolve(__dirname, "tmp", "output.csv");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const fileStream = fs.createWriteStream(outputPath);

    await pipeline(response.data, json2csv(), fileStream);

    const end = new Date().getTime();

    console.log("File has been written");
    console.log(`time spent: ${end - start}ms`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
})();
