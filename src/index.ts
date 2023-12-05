#!/usr/bin/env ts-node

import process from "process";
import fs from "fs";
import { Element, ElementCompact, xml2js } from "xml-js";

if (process.argv.length < 4 || !process.argv[2] || !process.argv[3]) {
  console.error("Usage: ./index.ts path_to_layouts/ kt_output_path/");
  process.exit(1);
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
    .map((i) => `private lateinit var ${i.id}: ${i.className}`)
    .join("\n");
  const bindings = viewInfo
    .map(({ id }) => `${id} = view.findViewById(R.id.${id})`)
    .join("\n");
  fs.writeFileSync(
    `${outputPath}/${layoutFile}.kt`,
    `
    ${declarations}

    fun bindView(View view) {
      ${bindings}
    }
  `
  );
  console.log("Done!");
}
