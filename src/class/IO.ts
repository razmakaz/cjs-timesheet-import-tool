import xlsx from "xlsx";
import fs from "fs";
import type { ICJSTimeRow } from "../types/ICJSTimeRow.d.ts";

class IO {
  private static async getFiles(directory: string): Promise<File[]> {
    type thing = File & any;
    const files: thing[] = [];
    fs.readdirSync(directory).forEach(async (file) => {
      const filePath = `${directory}/${file}`;
      const stats = fs.statSync(filePath);
      if (stats.isFile() && (file.endsWith(".xlsx") || file.endsWith(".xls"))) {
        files.push({ path: filePath, name: file });
      } else if (stats.isDirectory()) {
        const subFiles = await this.getFiles(filePath);
        files.push(...subFiles);
      }
    });
    return files;
  }

  private static async importFile(file: File & any): Promise<any[]> {
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
        const headers = jsonData[0] as any[];
        const rows = jsonData.slice(1);
        rows.forEach((row: any) => {
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
    const headers = Object.keys(data[0] || {});
    const rows = data.map((row) =>
      headers
        .map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    fs.writeFileSync(filePath, csvContent, "utf8");
    console.log(`Exported data to ${filePath}`);
  }
}

export default IO;
