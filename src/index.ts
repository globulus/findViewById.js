#!/usr/bin/env ts-node

import process from "process";
import fs from "fs";
import { Element, xml2js } from "xml-js";

if (process.argv.length < 4 || !process.argv[2] || !process.argv[3]) {
  console.error(
    "Usage: ./index.ts path_to_layouts/ kt_output_path/ [-java|-kt]"
  );
  process.exit(1);
}

type OutputType = "java" | "kt";
let outputType: OutputType = "kt";
if (process.argv.length === 5) {
  switch (process.argv[4]) {
    case "-java":
      outputType = "java";
      break;
    case "-kt":
      outputType = "kt";
      break;
    default:
      console.log("Invalid output type, use -java or -kt!");
      process.exit(1);
  }
}

type AndroidViewInfo = {
  className: string;
  id: string;
};
const androidIdKey = "android:id";

function extractViewInfo(content: Element): AndroidViewInfo[] {
  const result: AndroidViewInfo[] = [];
  const className = content.name;
  const id = content.attributes?.[androidIdKey];
  if (className && id && typeof id === "string") {
    result.push({ className, id: id.replace("@+id/", "") });
  }
  result.push(...(content.elements ?? []).flatMap(extractViewInfo));
  return result;
}

const layoutsPath: string = process.argv[2];
const outputPath: string = process.argv[3];
if (!fs.existsSync(layoutsPath)) {
  console.error("Invalid layouts path!");
}
if (fs.existsSync(outputPath)) {
  console.log("Output path exists, removing it...");
  fs.rmSync(outputPath, {
    force: true,
    recursive: true,
  });
}
fs.mkdirSync(outputPath);
const layoutFiles = fs
  .readdirSync(layoutsPath)
  .filter((f) => f.endsWith("xml"));
console.info(`Found ${layoutFiles.length} XML files, starting output...`);
for (const layoutFile of layoutFiles) {
  console.log(`Reading file ${layoutFile}...`);
  const xmlContent = fs
    .readFileSync(`${layoutsPath}/${layoutFile}`)
    .toString("utf-8");
  const jsonContent = xml2js(xmlContent, { compact: false }) as Element;
  const viewInfo = extractViewInfo(jsonContent);
  const declarations = viewInfo
    .map(({ className, id }) =>
      outputType === "java"
        ? `private ${className} ${id};`
        : `private lateinit var ${id}: ${className}`
    )
    .join("\n");
  const bindings = viewInfo
    .map(
      ({ id }) =>
        `${id} = view.findViewById(R.id.${id})${
          outputType === "java" ? ";" : ""
        }`
    )
    .join("\n");
  fs.writeFileSync(
    `${outputPath}/${layoutFile}.${outputType}`,
    `
    ${declarations}

    ${
      outputType === "java"
        ? "private void bindView(View view)"
        : "private fun bindView(view: View)"
    } {
      ${bindings}
    }
  `
  );
  console.log("Done!");
}
