import type { ICJSTimeRow } from "../types/ICJSTimeRow.d.ts";
import type { IAssociateRow } from "../types/IAssociateRow.d.ts";
import BOSS from "./BOSS.ts";
import { CompassMap } from "../data/CompassMap.ts";
import { LocationMap } from "../data/LocationMap.ts";
import * as luxon from "luxon";
import Fuse from "fuse.js";

class Processor {
  public static async preprocessData(
    data: ICJSTimeRow[]
  ): Promise<ICJSTimeRow[]> {
    const processedData: ICJSTimeRow[] = [];
    let lastRow: ICJSTimeRow | null = null;

    console.log("Preprocessing data...");
    console.log("Rows: ", data.length);
    // console.table(data);

    data.forEach((row) => {
      const newRow: ICJSTimeRow = { ...row };
      if (newRow["First name"] === "") {
        if (lastRow) {
          newRow["First name"] = lastRow["First name"];
          newRow["Last name"] = lastRow["Last name"];
          newRow.Job = lastRow.Job;
          newRow["Sub-job"] = lastRow["Sub-job"];
        }
      } else {
        lastRow = newRow;
      }
      processedData.push(newRow);
    });

    return processedData;
  }

  public static async buildAssociateScaffold(
    data: ICJSTimeRow[]
  ): Promise<any[]> {
    const associates: any[] = [];
    const associateMap: { [key: string]: any } = {};

    console.log("Building associate scaffold...");
    console.log("Rows: ", data.length);
    // console.table(data);

    data.forEach((row) => {
      const associateKey = `${row["First name"]} ${row["Last name"]} ${row.Job}`;
      if (!associateMap[associateKey]) {
        associateMap[associateKey] = {
          "First name": row["First name"],
          "Last name": row["Last name"],
          Job: row.Job,
          "Sub-job": row["Sub-job"],
          "Weekly total hours": row["Weekly total hours"],
          Shifts: [],
        };
      }
      associateMap[associateKey].Shifts.push({
        date: row["Start Date"],
        day: luxon.DateTime.fromFormat(
          row["Start Date"],
          "MM/dd/yyyy"
        ).toFormat("ccc"),
        hours: row["Daily total hours"],
      });
      associateMap[associateKey].Shifts.sort((a: any, b: any) => {
        return (
          luxon.DateTime.fromFormat(a.date, "MM/dd/yyyy").toMillis() -
          luxon.DateTime.fromFormat(b.date, "MM/dd/yyyy").toMillis()
        );
      });
      associateMap[associateKey].Shifts = associateMap[
        associateKey
      ].Shifts.filter((shift: any) => shift.hours !== "");
    });

    for (const associateKey in associateMap) {
      associates.push(associateMap[associateKey]);
    }

    return associates;
  }

  public static async buildWeekScaffold(data: any[]): Promise<any[]> {
    const weekScaffold: any[] = [];

    console.log("Building week scaffold...");
    console.log("Associates: ", data.length);
    // console.table(data);

    data.forEach((associate) => {
      const associateShifts = associate.Shifts;
      const weekRow: any = {
        "First name": associate["First name"],
        "Last name": associate["Last name"],
        Job: associate.Job,
        Sun: "",
        Mon: "",
        Tue: "",
        Wed: "",
        Thu: "",
        Fri: "",
        Sat: "",
        "Weekly total hours": associate["Weekly total hours"],
      };

      associateShifts.forEach((shift: any) => {
        const dayOfWeek = luxon.DateTime.fromFormat(
          shift.date,
          "MM/dd/yyyy"
        ).toFormat("ccc");
        weekRow[dayOfWeek] = parseFloat(shift.hours).toFixed(2);
      });

      weekScaffold.push(weekRow);
    });

    return weekScaffold;
  }

  public static async processOvertime(
    data: any[],
    ignoreDT = true
  ): Promise<any[]> {
    const overtimeData: any[] = [];

    console.log("Processing overtime...");
    console.log("Associates: ", data.length);
    // console.table(data);

    data.forEach((associate) => {
      const totalHours = parseFloat(associate["Weekly total hours"]) || 0;
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(totalHours - 40, 0);
      const doubleTimeHours = ignoreDT ? 0 : Math.max(overtimeHours - 20, 0);

      const { "Weekly total hours": _, ...rest } = associate;

      overtimeData.push({
        ...rest,
        Reg: regularHours.toFixed(2),
        OT: (overtimeHours - doubleTimeHours).toFixed(2),
        DT: doubleTimeHours.toFixed(2),
        "Weekly Total": totalHours.toFixed(2),
      });
    });

    return overtimeData;
  }

  public static async postProcessData(
    data: any[],
    convertTimeToDecimal: boolean = true
  ): Promise<any[]> {
    // Go through and remove any empty cells and replace them with undefined.
    // Additionally, replace time values like "9:30" with 9.5 if convertTimeToDecimal is true.
    const processedData: any[] = [];
    data.forEach((associate) => {
      const processedRow: any = {};
      Object.keys(associate).forEach((key) => {
        if (associate[key] === "") {
          processedRow[key] = undefined;
        } else if (
          convertTimeToDecimal &&
          typeof associate[key] === "string" &&
          associate[key].includes(":")
        ) {
          const [hours, minutes] = associate[key].split(":").map(Number);
          processedRow[key] = hours + minutes / 60;
        } else {
          processedRow[key] = associate[key];
        }
      });
      processedData.push(processedRow);
    });
    return processedData;
  }

  public static async mapAssignments(data: any[]): Promise<any[]> {
    const mappedData: any[] = [];

    console.log("Mapping assignments...");
    console.log("Rows: ", data.length);

    const assignments = (await BOSS.getAssignments()) || [];

    console.log("Assignments: ", assignments.length);
    console.log("Assignments: ", assignments.slice(0, 5));

    for (const row of data) {
      const job = row.Job;
      const locationName = LocationMap[job] || job;
      const compassJob = CompassMap[job] || job;
      const firstName = row["First name"];
      const lastName = row["Last name"];

      const nameSearch = `${firstName} ${lastName}`.trim();
      const nameFuse = new Fuse(assignments, {
        keys: ["contractor.full_name"],
        threshold: 0.4, // Slightly relaxed threshold for better matching
        distance: 100, // Allow for more leniency in matching
      });
      const nameResults = nameFuse
        .search(nameSearch)
        .map((result) => result.item);

      const locationSearch = `${firstName} ${lastName} ${locationName}`.trim();
      const locationFuse = new Fuse(assignments, {
        keys: ["contractor.full_name", "job_title"],
        threshold: 0.5, // Adjusted threshold for less strict matching
        distance: 100, // Allow for more leniency in matching
      });
      const locationResults = locationFuse
        .search(locationSearch)
        .map((result) => result.item);

      // Fallback mechanism for unmatched results
      if (locationResults.length === 0) {
        const fallbackFuse = new Fuse(assignments, {
          keys: ["job_title"],
          threshold: 0.6,
        });
        locationResults.push(
          ...fallbackFuse.search(locationName).map((result) => result.item)
        );
      }

      let note = "";
      if (nameResults.length === 0) {
        note = "No contractor";
      } else if (locationResults.length === 0) {
        note = "No assignment";
      }

      mappedData.push({
        "COMPASS ID": compassJob,
        Note: note,
        "Full Name": nameResults?.[0]?.contractor?.full_name || "",
        ...row,
      });
    }

    return mappedData;
  }

  public static async generateSummary(data: any[]): Promise<any[]> {
    // Build an identical structure to the original data but only with the total hours in each of the Reg, OT, and DT columns then a grand total hours column
    const summaryData: any[] = [];
    const summaryRow: any = {
      Reg: 0,
      OT: 0,
      DT: 0,
      Total: 0,
    };
    data.forEach((associate) => {
      summaryRow.Reg += parseFloat(associate.Reg) || 0;
      summaryRow.OT += parseFloat(associate.OT) || 0;
      summaryRow.DT += parseFloat(associate.DT) || 0;
    });
    summaryRow.Total = summaryRow.Reg + summaryRow.OT + summaryRow.DT;
    summaryData.push(summaryRow);
    return summaryData;
  }

  public static async generateReport(
    data: ICJSTimeRow[],
    options: {
      ignoreDT?: boolean;
      convertTimeToDecimal?: boolean;
    } = {}
  ): Promise<any> {
    const { ignoreDT = false, convertTimeToDecimal = true } = options;
    const preprocessedData = await this.preprocessData(data);
    const associateScaffold = await this.buildAssociateScaffold(
      preprocessedData
    );
    const weekScaffold = await this.buildWeekScaffold(associateScaffold);
    const overtimeData = await this.processOvertime(weekScaffold, ignoreDT);

    const mappedData = await this.mapAssignments(overtimeData);

    const postProcessedData = await this.postProcessData(
      mappedData,
      convertTimeToDecimal
    );

    const final = postProcessedData;

    console.log("Final data:");
    console.table(await this.generateSummary(final));

    return final;
  }
}

export default Processor;
