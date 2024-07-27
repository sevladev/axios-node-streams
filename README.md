# JSON to CSV Conversion Project

This project demonstrates how to make a request to an API to retrieve a large amount of JSON data, convert it to CSV format, and save the data to a file. By using streams, we significantly reduce the processing time, which originally took about 9.2 seconds without streams.

## Technologies Used

- Node.js
- Axios
- Node.js Streams
- pnpm

## Prerequisites

- Node.js installed
- pnpm installed

## Project Structure

```
.
├── src
│ └── index.js
├── tmp
│ └── .keep
├── .gitignore
├── package.json
├── README.md
└── pnpm-lock.yaml
```

## Code Explanation

The main script is located in `src/index.js`. Below is a detailed explanation of each part of the code:

1.  **Importing Modules:**

    We import the necessary modules for file manipulation, path handling, stream creation, and HTTP requests.

```js
import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
```

2.  **Setting Up File Paths:**

    We use `fileURLToPath` and `path.dirname` to get the directory of the current file.

```js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(\_\_filename);
```

3.  **Axios Client Configuration:**

    We configure the Axios client to make requests to the API `https://randomuser.me/api` and receive the response as a stream.

```js
const client = axios.create({
  baseURL: "https://randomuser.me/api",
  responseType: "stream",
});
```

4.  **Object Flattening Function:**

    The `flattenObject` function converts a nested object into a flat object where keys represent the full path of the properties.

```js
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
```

5.  **JSON to CSV Transformation Function:**

    We create a stream transformation function that converts JSON to CSV.

```js
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
```

6.  **Executing the Script:**

    We use an async function to execute the script, make the request to the API, process the response, and write to a CSV file.

```js
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
```

## Conclusion

This project showcases how to efficiently handle large amounts of JSON data by converting it to CSV format and saving it to a file using Node.js streams. The use of streams is crucial for performance, especially when dealing with large datasets.

Feel free to ask any questions if you have doubts or need further explanations.
