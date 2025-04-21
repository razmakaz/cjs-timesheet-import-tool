# CJS Timesheet Conversion Tool

This tool is designed to process and convert timesheet data from spreadsheets. 
It runs in a Node.js environment with version 22.

## Prerequisites
- Ensure you have Node.js version 22 installed. You can verify your version by running `node -v`.
- If you are using `nvm` (Node Version Manager), you can switch to the correct version by running:
    - `nvm use 22` (if Node.js 22 is already installed)
    - `nvm install 22` (to install and use Node.js 22 if it's not already installed)

## Installation
1. Install the required dependencies by running:
     ```bash
     npm install
     ```
     or
     ```bash
     yarn
     ```

## Usage Instructions
1. Clear out the `import` folder in the project directory.
2. Place the spreadsheets with time data into the `import` folder.
3. Start the development server to process the files:
     - For npm users:
         ```bash
         npm run dev
         ```
     - For Yarn users:
         ```bash
         yarn dev
         ```

The tool will process the spreadsheets and convert the timesheet data as required. The processed data will be written to `./export/processed.xlsx`.