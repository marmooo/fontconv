import { copySync } from "https://deno.land/std/fs/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

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
  shims: {
    deno: true,
  },
  package: {
    name: "fontconv",
    version: "0.0.2",
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
