export interface ICJSTimeRow {
  "First name": string;
  "Last name": string;
  Job: string;
  "Sub-job": string;
  "Start Date": string;
  In: string;
  "End Date": string;
  Out: string;
  "Daily total hours": string;
  "Weekly total hours": string;

  // Catch-all property to allow for additional fields
  [key: string]: string;
}
