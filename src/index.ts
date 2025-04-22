import IO from "./class/IO.ts";
import Processor from "./class/Processor.ts";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

console.log("API Key: ", process.env.CJS_API_KEY);
console.log("API Base: ", process.env.BOSS_API_BASE);

const importDir = path.join(process.cwd(), "import");
const exportDir = path.join(process.cwd(), "export");

if (!fs.existsSync(importDir)) {
  fs.mkdirSync(importDir, { recursive: true });
}

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const data = await IO.import(process.cwd().toString() + "/import");

const processed = await Processor.generateReport(data, {
  ignoreDT: true,
  convertTimeToDecimal: true,
});
console.table(processed);

IO.export(processed, process.cwd().toString() + "/export/processed.csv");
