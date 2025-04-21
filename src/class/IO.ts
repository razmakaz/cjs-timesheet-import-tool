import xlsx from "xlsx";
import fs from "fs";
import type { ICJSTimeRow } from "../types/ICJSTimeRow.js";

class IO {
  private static async getFiles(directory: string): Promise<File[]> {
    const files: File[] = [];
    fs.readdirSync(directory).forEach((file) => {
      const filePath = `${directory}/${file}`;
      const stats = fs.statSync(filePath);
      if (stats.isFile() && (file.endsWith(".xlsx") || file.endsWith(".xls"))) {
        files.push({ path: filePath, name: file });
      } else if (stats.isDirectory()) {
        const subFiles = this.getFiles(filePath);
        files.push(...subFiles);
      }
    });
    return files;
  }

  private static async importFile(file: File): Promise<any[]> {
    const workbook = xlsx.readFile(file.path);
    const sheetNames = workbook.SheetNames;
    const data: any[] = [];

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
      });
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        rows.forEach((row) => {
          const rowData: any = {};
          headers.forEach((header: string, index: number) => {
            rowData[header] = String(row[index] || ""); // Ensure all values are strings
          });
          data.push(rowData);
        });
      }
    }

    return data;
  }

  public static async import(directory: string): Promise<any[]> {
    console.log(`Importing files from ${directory}...`);
    const files = await this.getFiles(directory);
    const data: any[] = [];
    console.log(`Importing ${files.length} files...`);

    for (const file of files) {
      const fileData = await this.importFile(file);
      data.push(...fileData);
    }

    return data as ICJSTimeRow[];
  }

  public static async export(data: any[], filePath: string): Promise<void> {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    xlsx.writeFile(workbook, filePath);
    console.log(`Exported data to ${filePath}`);
  }
}

export default IO;
