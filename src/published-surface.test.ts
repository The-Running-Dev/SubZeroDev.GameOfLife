/**
 * Enforces CP1, CP2 and CP3 (`design/20-contract.md`): nothing under `src/` or `scripts/`
 * imports past the engine's published surface, no production source but the exporter writes
 * or deletes under `content/`, and no production source reads a file under `content/`.
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

const ENGINE_PACKAGE = "@the-running-dev/game-engine";
const PUBLISHED_ENGINE_SURFACE = new Set([ENGINE_PACKAGE, `${ENGINE_PACKAGE}/authoring`]);

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
 *  name for a scoped package, the first path segment otherwise. This is why an engine
 *  specifier can never be decided by the declared-packages fallback: it reduces every engine
 *  subpath to the declared dependency name, which is present, so the fallback would allow
 *  all of them. `isAllowedSpecifier` settles the engine before reaching it. */
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
  // The engine is decided by PUBLISHED_ENGINE_SURFACE alone. Without this line a subpath such
  // as `@the-running-dev/game-engine/internal` falls through to the declared-packages check,
  // which reduces it to the declared dependency name and allows it — so the check CP1 names as
  // its evidence would permit exactly what CP1 forbids. The engine's own `exports` map
  // publishes only these two paths today, so such an import cannot currently resolve; that is
  // the dependency's packaging holding a rule this repository states, and CP1 is this
  // repository's to hold.
  if (packageNameOf(specifier) === ENGINE_PACKAGE) return false;
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

  it("rejects an engine specifier that is neither published one, which the declared-packages fallback would otherwise allow", () => {
    // A validator that has never rejected anything is not known to constrain anything, and
    // this is the half of CP1 no source exercises: the relative-import form above is the
    // hazard the submodule creates, and this is the form the package name hides.
    expect(isAllowedSpecifier(`${ENGINE_PACKAGE}/internal`, srcDir)).toBe(false);
    expect(isAllowedSpecifier(`${ENGINE_PACKAGE}/dist/kinds/simulation/validate.js`, srcDir)).toBe(false);
    expect(isAllowedSpecifier(ENGINE_PACKAGE, srcDir)).toBe(true);
    expect(isAllowedSpecifier(`${ENGINE_PACKAGE}/authoring`, srcDir)).toBe(true);
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
  it("is the only production file under src/ or scripts/ that writes or deletes a file", () => {
    // A test fixture writing into content/ to prove the exporter cleans it up (S13.1) is
    // not a second writer in the sense CP2 protects against — CP2 governs what is
    // published, not what a test does to its own fixture. That scope is contracted, not a
    // local convention: CP2 and CP3 both read "production source", and the obligation the
    // scope carries is that such a test restores the directory before it ends. CP1 still
    // checks test files like any other source.
    const writers: string[] = [];
    for (const file of files.filter((f) => !f.endsWith(".test.ts"))) {
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

/** Identifiers in one file bound to a path that names the content directory — `outputDir`
 *  and `contentDir` themselves, and anything built from them or from a literal `"content"`
 *  segment, such as `const manifestPath = path.join(projectRoot, "content", "x.json")`.
 *
 *  Resolving only literal arguments is what let a real CP3 violation sit unnoticed: the read
 *  was `readFile(manifestPath, ...)`, whose argument names neither directory binding and is
 *  not a literal, so the target looked innocuous one hop from the path that was not. */
const BINDING_PATTERN = /\b(?:const|let|var)\s+(\w+)\s*=\s*([^;\n]*)/g;

function mentions(text: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`).test(text);
}

function contentBindingsOf(text: string): Set<string> {
  const bound = new Set(["contentDir", "outputDir"]);
  // To a fixed point, so a binding built from another binding is caught as well.
  for (;;) {
    let grew = false;
    for (const [, name, initializer] of text.matchAll(BINDING_PATTERN)) {
      if (name === undefined || initializer === undefined || bound.has(name)) continue;
      const namesContent =
        /["']content["']/.test(initializer) || [...bound].some((b) => mentions(initializer, b));
      if (namesContent) {
        bound.add(name);
        grew = true;
      }
    }
    if (!grew) return bound;
  }
}

/** Every read in `text` whose target resolves under content/ — as a literal path, through a
 *  content binding, or through an inline `"content"` segment. Returns the raw targets. */
export function contentReadsIn(text: string, fileDir: string): string[] {
  const { named, aliases } = fsBindingsOf(text);
  const readNames = READ_FILE_FNS.filter((n) => named.has(n));
  const bindings = contentBindingsOf(text);
  const found: string[] = [];
  for (const rawArgs of callsOf(text, readNames, [...aliases])) {
    const target = firstArgument(rawArgs);
    const literal = target.match(/^["'](.+)["']$/);
    const resolved = literal ? path.resolve(fileDir, literal[1]!) : null;
    const suspect =
      (resolved !== null && isInside(resolved, contentDir)) ||
      [...bindings].some((b) => mentions(target, b)) ||
      /["']content["']/.test(target);
    if (suspect) found.push(target);
  }
  return found;
}

describe("no production source reads content/ (CP3)", () => {
  it("has no production file under src/ or scripts/ that reads a file under content/", () => {
    // Scoped to production sources, as CP2 above is: a test may read a published file to
    // perturb and restore it, which is how the clean check is proven to fire against the
    // directory it actually guards. What is forbidden is a source that ships.
    const violations: string[] = [];
    for (const file of files.filter((f) => !f.endsWith(".test.ts"))) {
      const text = readFileSync(file, "utf8");
      for (const target of contentReadsIn(text, path.dirname(file))) {
        violations.push(`${relativePosix(file)} reads "${target}"`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("catches a read one hop from the path, which is the form that slipped through before", () => {
    // A validator that has never rejected anything is not known to constrain anything. This
    // is the exact shape src/check-clean.test.ts used while CP3 was unscoped and unenforced.
    const offender = [
      'import { readFile } from "node:fs/promises";',
      'const manifestPath = path.join(projectRoot, "content", "manifest.json");',
      'const original = await readFile(manifestPath, "utf8");',
    ].join("\n");
    expect(contentReadsIn(offender, scriptsDir)).toEqual(["manifestPath"]);

    const innocent = [
      'import { readFile } from "node:fs/promises";',
      'const pkgPath = path.join(projectRoot, "package.json");',
      'const original = await readFile(pkgPath, "utf8");',
    ].join("\n");
    expect(contentReadsIn(innocent, scriptsDir)).toEqual([]);
  });
});
