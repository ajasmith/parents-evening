import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = join(repositoryRoot, "dist");

function fingerprintFile(fileName) {
  const contents = readFileSync(join(repositoryRoot, fileName));
  const extensionIndex = fileName.lastIndexOf(".");
  const hash = createHash("sha256").update(contents).digest("hex").slice(0, 12);
  const outputFileName =
    `${fileName.slice(0, extensionIndex)}.${hash}${fileName.slice(extensionIndex)}`;

  copyFileSync(join(repositoryRoot, fileName), join(outputDirectory, outputFileName));
  return outputFileName;
}

function replaceRequired(source, searchValue, replacement) {
  if (!source.includes(searchValue)) {
    throw new Error(`Could not find ${searchValue} in index.html.`);
  }

  return source.replace(searchValue, replacement);
}

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory);

const styleFileName = fingerprintFile("styles.css");
const scriptFileName = fingerprintFile("script.js");
const sourceHtml = readFileSync(join(repositoryRoot, "index.html"), "utf8");
const htmlWithHashedStyles = replaceRequired(
  sourceHtml,
  'href="styles.css"',
  `href="${styleFileName}"`,
);
const builtHtml = replaceRequired(
  htmlWithHashedStyles,
  'src="script.js"',
  `src="${scriptFileName}"`,
);

writeFileSync(join(outputDirectory, "index.html"), builtHtml);
copyFileSync(join(repositoryRoot, "profiles.json"), join(outputDirectory, "profiles.json"));
cpSync(join(repositoryRoot, "resources"), join(outputDirectory, "resources"), {
  recursive: true,
});

console.log(`Built ${styleFileName} and ${scriptFileName}`);
