import IO from "./class/IO.ts";
import Processor from "./class/Processor.ts";

const data = await IO.import(process.cwd().toString() + "/import");

const processed = await Processor.generateReport(data, {
  ignoreDT: true,
  convertTimeToDecimal: true,
});
console.table(processed);

IO.export(processed, process.cwd().toString() + "/export/processed.xlsx");
