// Read the raw docs file and clean it up

import { writeFileSync } from "fs";
import { join } from "path";

import * as rawDocs from "./docs-raw.json" assert { type: "json" };

const cleanedDocs = rawDocs.default.map((doc) => {
  if (doc.title === "Not Implemented") return null;

  return {
    title: doc.title,
    description: doc.description,
    slug: doc.slug,
    content: doc.body.raw,
  };
});

// Filter out the null values
const filteredDocs = cleanedDocs.filter((doc) => doc);

// Create text files for each doc
filteredDocs.forEach((doc) => {
  const filePath = join(
    process.cwd(),
    "data",
    "text",
    `${doc.title.replace(" ", "")}.txt`
  );
  writeFileSync(filePath, doc.content);
});

// Write the file to the data directory
// const filePath = join(process.cwd(), "data", "docs.json");
// writeFileSync(filePath, JSON.stringify(filteredDocs, null, 2));
