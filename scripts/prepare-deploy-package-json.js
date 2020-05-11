/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

const fs = require("fs");
const path = require("path");

const pickFields = [
  "name",
  "version",
  "license",
  "author",
  "homepage",
  "repository",
  "bugs",
  "keywords",
  "module",
  "main",
  "typings",
  "dependencies",
  "peerDependencies",
  "files",
];

const filePath = path.resolve(__dirname, "..", "package.json");
const contents = fs.readFileSync(filePath);
const packageJson = JSON.parse(contents);
const newPackageJson = Object.fromEntries(
  Object.entries(packageJson).filter(([key]) => pickFields.includes(key))
);
fs.writeFileSync(filePath, JSON.stringify(newPackageJson, null, 2));
