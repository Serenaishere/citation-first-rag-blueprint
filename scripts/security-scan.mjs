import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("../", import.meta.url);
const readableExtensions = new Set([
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yaml",
  ".yml",
]);
const skippedDirectories = new Set([".git", "node_modules"]);

const patterns = [
  {
    name: "private key material",
    expression: new RegExp(["BEGIN", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY"].join(" ")),
  },
  {
    name: "credential-like assignment",
    expression: new RegExp(
      String.raw`(?:api[_-]?key|client[_-]?secret|password|passwd|access[_-]?token)\s*[:=]\s*["']?(?!<|\$\{|YOUR_|example|placeholder)[A-Za-z0-9_./+=-]{12,}`,
      "i",
    ),
  },
  {
    name: "credential in URL",
    expression: /(?:https?|postgres(?:ql)?|mysql):\/\/[^\s/:]+:[^\s/@]+@/i,
  },
  {
    name: "known access-token prefix",
    expression: new RegExp(
      ["gh" + "p_[A-Za-z0-9]{20,}", "github" + "_pat_[A-Za-z0-9_]{20,}", "sk" + "-[A-Za-z0-9_-]{20,}", "AK" + "IA[0-9A-Z]{16}", "gl" + "pat-[A-Za-z0-9_-]{20,}", "xo" + "x[baprs]-[A-Za-z0-9-]{20,}"].join("|"),
    ),
  },
  {
    name: "private IPv4 address",
    expression: /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/,
  },
  {
    name: "local Windows path",
    expression: /\b[A-Za-z]:\\(?:Users|Documents and Settings|产品)\\/i,
  },
  {
    name: "email address",
    expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    name: "mainland China mobile number",
    expression: /(?<!\d)1[3-9]\d{9}(?!\d)/,
  },
  {
    name: "internal hostname",
    expression: /\b(?:[a-z0-9-]+\.)+(?:internal|local|corp)\b/i,
  },
];

function looksLikeHighEntropyCredential(line) {
  const quotedValues = line.match(/["'][A-Za-z0-9_./+=-]{32,}["']/g) ?? [];
  return quotedValues.some((quoted) => {
    const value = quoted.slice(1, -1);
    const categories = [/[a-z]/, /[A-Z]/, /\d/, /[_./+=-]/].filter((rule) =>
      rule.test(value),
    ).length;
    return categories >= 3 && !value.includes("example") && !value.includes("placeholder");
  });
}

async function collect(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        files.push(...(await collect(new URL(`${entry.name}/`, directoryUrl))));
      }
    } else if (entry.isFile() && readableExtensions.has(extname(entry.name))) {
      files.push(new URL(entry.name, directoryUrl));
    }
  }
  return files;
}

const findings = [];
for (const fileUrl of await collect(root)) {
  const text = await readFile(fileUrl, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.expression.test(line)) {
        findings.push({
          file: relative(root.pathname, fileUrl.pathname),
          line: index + 1,
          rule: pattern.name,
        });
      }
    }
    if (looksLikeHighEntropyCredential(line)) {
      findings.push({
        file: relative(root.pathname, fileUrl.pathname),
        line: index + 1,
        rule: "high-entropy quoted value",
      });
    }
  });
}

if (findings.length > 0) {
  console.error("Security scan failed. Potentially sensitive values were found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "Security scan passed: no configured secret, credential, private-network, personal-contact, local-path, or high-entropy patterns found.",
  );
}
