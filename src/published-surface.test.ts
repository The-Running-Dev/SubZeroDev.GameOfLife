/**
 * Enforces CP1, CP2 and CP3 (`design/20-contract.md`): nothing under `src/` or `scripts/`
 * imports past the engine's published surface, nothing but the exporter writes or deletes
 * under `content/`, and nothing reads a file under `content/`.
 *
 * CP1 is the row the submodule makes easy to break by accident — a relative import into
 * `engine/`'s own source tree typechecks, runs, and passes every other gate, and only fails
 * once the pin moves or the campaign runs on a published engine version. Static analysis
 * over the import specifiers is what catches it before that point.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { isBuiltin } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const srcDir = path.join(projectRoot, "src");
const scriptsDir = path.join(projectRoot, "scripts");
const contentDir = path.join(projectRoot, "content");

const pkg = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const declaredPackages = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
]);

const PUBLISHED_ENGINE_SURFACE = new Set([
  "@the-running-dev/game-engine",
  "@the-running-dev/game-engine/authoring",
]);

/** Every `.ts`/`.mjs` file under `root`, walked recursively. */
function walk(root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(root)) {
    const full = path.join(root, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else if (name.endsWith(".ts") || name.endsWith(".mjs")) {
      out.push(full);
    }
  }
  return out;
}

const files = [...walk(srcDir), ...walk(scriptsDir)];

interface ImportSpecifier {
  readonly specifier: string;
  readonly line: number;
}

/** Static import, dynamic `import(...)`, and `export ... from` specifiers — the forms this
 *  repository's ESM sources can use to reach another module. */
// The trailing from-clause groups are lazily optional (double-question-mark, prefer zero
// reps) rather than plain-optional (single question mark, prefer one rep) — a plain
// single-question-mark quantifier is greedy and, for a side-effect-only import with no
// from-clause at all, would search forward past it for a from-clause belonging to a later
// statement instead of matching the specifier right in front of it.
const SPECIFIER_PATTERN =
  /(?:\bimport\s+(?:[\s\S]*?\bfrom\s+)??|\bexport\s+(?:[\s\S]*?\bfrom\s+)??|\bimport\s*\()\s*["']([^"']+)["']/g;

function specifiersOf(text: string): ImportSpecifier[] {
  const found: ImportSpecifier[] = [];
  for (const match of text.matchAll(SPECIFIER_PATTERN)) {
    const specifier = match[1];
    if (specifier === undefined || match.index === undefined) continue;
    const line = text.slice(0, match.index).split("\n").length;
    found.push({ specifier, line });
  }
  return found;
}

/** The name a specifier would be declared under in `package.json` — the scope-qualified
 *  name for a scoped package, the first path segment otherwise. Subpaths of the engine
 *  package are handled separately, by exact match, since only two are published. */
function packageNameOf(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : (segments[0] ?? specifier);
}

function isInside(candidate: string, root: string): boolean {
  return candidate === root || candidate.startsWith(root + path.sep);
}

/** Repo-relative, forward-slashed — stable across the host OS's path separator. */
function relativePosix(file: string): string {
  return path.relative(projectRoot, file).split(path.sep).join("/");
}

function isAllowedSpecifier(specifier: string, fileDir: string): boolean {
  if (PUBLISHED_ENGINE_SURFACE.has(specifier)) return true;
  if (isBuiltin(specifier)) return true;
  if (specifier.startsWith(".")) {
    const resolved = path.resolve(fileDir, specifier);
    return isInside(resolved, srcDir) || isInside(resolved, scriptsDir);
  }
  return declaredPackages.has(packageNameOf(specifier));
}

describe("the published surface (CP1)", () => {
  it("imports nothing outside the engine's published surface, Node, a declared package, or this repository's own src/scripts", () => {
    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const fileDir = path.dirname(file);
      for (const { specifier, line } of specifiersOf(text)) {
        if (!isAllowedSpecifier(specifier, fileDir)) {
          violations.push(`${relativePosix(file)}:${line} imports "${specifier}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

/** `node:fs`/`node:fs/promises` (and their bare-specifier equivalents) local bindings for a
 *  file — named imports, plus a namespace/default alias for the `alias.fn(...)` call form. */
interface FsBindings {
  readonly named: Set<string>;
  readonly aliases: Set<string>;
}

const FS_MODULES = new Set(["fs", "node:fs", "fs/promises", "node:fs/promises"]);
const FS_IMPORT_PATTERN =
  /import\s+(?:(\*\s+as\s+(\w+))|(\w+)|\{([^}]*)\})\s+from\s+["'](fs|node:fs|fs\/promises|node:fs\/promises)["']/g;

function fsBindingsOf(text: string): FsBindings {
  const named = new Set<string>();
  const aliases = new Set<string>();
  for (const match of text.matchAll(FS_IMPORT_PATTERN)) {
    const [, , namespaceAlias, defaultAlias, namedList] = match;
    if (namespaceAlias) aliases.add(namespaceAlias);
    if (defaultAlias) aliases.add(defaultAlias);
    if (namedList) {
      for (const part of namedList.split(",")) {
        const name = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) named.add(name);
      }
    }
  }
  return { named, aliases };
}

const WRITE_OR_DELETE_FNS = [
  "writeFile", "writeFileSync", "mkdir", "mkdirSync", "rm", "rmSync", "rmdir", "rmdirSync",
  "unlink", "unlinkSync", "appendFile", "appendFileSync", "rename", "renameSync",
  "copyFile", "copyFileSync", "truncate", "truncateSync", "symlink", "symlinkSync",
  "link", "linkSync", "chmod", "chmodSync", "chown", "chownSync", "utimes", "utimesSync",
  "createWriteStream",
];

const READ_FILE_FNS = ["readFile", "readFileSync", "createReadStream"];

/** Every `name(...)` or `alias.name(...)` call, with the raw (unparsed) argument text. */
function callsOf(text: string, names: readonly string[], aliases: readonly string[]): string[] {
  if (names.length === 0) return [];
  const calls: string[] = [];
  const bareNames = names.map((n) => `\\b${n}\\s*\\(`);
  const aliasedNames = aliases.flatMap((a) => names.map((n) => `\\b${a}\\.${n}\\s*\\(`));
  const pattern = new RegExp([...bareNames, ...aliasedNames].join("|"), "g");
  for (const match of text.matchAll(pattern)) {
    const start = match.index! + match[0].length;
    let depth = 1;
    let end = start;
    while (end < text.length && depth > 0) {
      if (text[end] === "(") depth++;
      else if (text[end] === ")") depth--;
      end++;
    }
    calls.push(text.slice(start, end - 1));
  }
  return calls;
}

/** The first top-level (paren-depth-0) comma-separated argument, trimmed. */
function firstArgument(rawArgs: string): string {
  let depth = 0;
  for (let i = 0; i < rawArgs.length; i++) {
    const ch = rawArgs[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) return rawArgs.slice(0, i).trim();
  }
  return rawArgs.trim();
}

describe("the single writer (CP2)", () => {
  it("is the only file under src/ or scripts/ that writes or deletes a file", () => {
    const writers: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const { named, aliases } = fsBindingsOf(text);
      const writeNames = WRITE_OR_DELETE_FNS.filter((n) => named.has(n));
      const calls = callsOf(text, writeNames, [...aliases]);
      if (calls.length > 0) writers.push(relativePosix(file));
    }
    expect(writers).toEqual(["scripts/export-content.ts"]);
  });

  it("resolves every write and delete the exporter performs under content/", () => {
    const exporterPath = path.join(scriptsDir, "export-content.ts");
    const text = readFileSync(exporterPath, "utf8");

    // outputDir must itself be declared as a path.join(..., "content").
    const outputDirDeclaration = text.match(
      /const\s+outputDir\s*=\s*path\.join\([^)]*["']content["']\s*\)/,
    );
    expect(outputDirDeclaration, "outputDir must be declared as path.join(..., \"content\")").not.toBeNull();

    const { named, aliases } = fsBindingsOf(text);
    const writeNames = WRITE_OR_DELETE_FNS.filter((n) => named.has(n));
    const calls = callsOf(text, writeNames, [...aliases]);
    expect(calls.length).toBeGreaterThan(0);

    for (const rawArgs of calls) {
      const target = firstArgument(rawArgs);
      const targetsContent = target === "outputDir" || target.startsWith("path.join(outputDir");
      expect(targetsContent, `write/delete target "${target}" must be outputDir or path.join(outputDir, ...)`).toBe(true);
    }
  });
});

describe("nothing reads content/ (CP3)", () => {
  it("has no file under src/ or scripts/ that reads a file under content/", () => {
    const violations: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const fileDir = path.dirname(file);
      const { named, aliases } = fsBindingsOf(text);
      const readNames = READ_FILE_FNS.filter((n) => named.has(n));
      const calls = callsOf(text, readNames, [...aliases]);
      for (const rawArgs of calls) {
        const target = firstArgument(rawArgs);
        // A string literal argument is resolved directly; anything dynamic that even
        // mentions the content directory's name is flagged rather than silently passed.
        const literal = target.match(/^["'](.+)["']$/);
        const resolved = literal ? path.resolve(fileDir, literal[1]!) : null;
        if ((resolved && isInside(resolved, contentDir)) || /\bcontentDir\b|\boutputDir\b/.test(target)) {
          violations.push(`${relativePosix(file)} reads "${target}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
