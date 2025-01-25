import { copySync } from "@std/fs";
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [
    "./mod.js",
    {
      kind: "bin",
      name: "fontconv",
      path: "./cli.js",
    },
  ],
  outDir: "./npm",
  importMap: "deno.json",
  compilerOptions: {
    lib: ["ESNext"],
  },
  shims: {
    deno: true,
  },
  package: {
    name: "fontconv",
    version: "0.0.3",
    description:
      "Convert and compress fonts (.ttf, .otf, .eot, .svg, .woff, .woff2).",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/marmooo/fontconv/repo.git",
    },
    bugs: {
      url: "https://github.com/marmooo/fontconv/issues",
    },
  },
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
    copySync("test", "npm/esm/test");
    copySync("test", "npm/script/test");
  },
});
