import esbuild from "esbuild";
import { builtinModules } from "node:module";

// node esbuild.config.mjs        -> main.js (the plugin, committed and attached to releases)
// node esbuild.config.mjs test   -> test/.build/utm.cjs (pure logic, for node --test)
const forTest = process.argv[2] === "test";
await esbuild.build({
  entryPoints: [forTest ? "src/utm.ts" : "src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtinModules, ...builtinModules.map((name) => `node:${name}`)],
  format: "cjs",
  target: "es2018",
  logLevel: "warning",
  sourcemap: false,
  treeShaking: true,
  legalComments: "none",
  banner: { js: "/* WeAdU UTM Ledger. Built with esbuild from src/. Do not edit. */" },
  outfile: forTest ? "test/.build/utm.cjs" : "main.js",
});
