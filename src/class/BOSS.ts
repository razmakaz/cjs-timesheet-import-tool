import { assignments } from "../data/Assignments.ts";
import Fuse from "fuse.js";

class BOSS {
  public static async getAssignments(): Promise<any> {
    const url = new URL(process.env.BOSS_API_BASE + "/placements/");
    url.searchParams.append("page", "1");
    url.searchParams.append("page_size", "1000");
    console.log("URL: ", url.toString());
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": `${process.env.CJS_API_KEY}`,
      },
    }).then((res) => res.json());
    // console.log("Response: ", response);
    return response?.results || [];
  }
}

export default BOSS;
