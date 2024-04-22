import { extname } from "https://deno.land/std/path/mod.ts";
import { Command } from "npm:commander@12.0.0";
import { convert } from "./mod.js";

const program = new Command();
program
  .name("fontconv")
  .description(
    "Convert and compress fonts (.ttf, .otf, .eot, .svg, .woff, .woff2).",
  )
  .version("0.0.1");
program
  .argument("<input>", "Path of input font file")
  .argument("<output>", "Path of output font file")
  .option("--text <string>", "characters to compress")
  .option(
    "--text-file <path>",
    "Path of line separated character file to compress",
  )
  .option("--code <string>", "comma separated codepoints to compress")
  .option(
    "--code-file <path>",
    "Path of line separated codepoint file to compress",
  );
program.parse();

const inPath = program.args[0];
const outPath = program.args[1];
const options = program.opts();

async function main() {
  const inFormat = extname(inPath);
  const inFont = (inFormat === ".svg")
    ? Deno.readTextFileSync(inPath)
    : Deno.readFileSync(inPath);
  const outFormat = extname(outPath);
  const outFont = await convert(inFont, outFormat, options);
  if (outFormat === ".svg") {
    Deno.writeTextFileSync(outPath, outFont);
  } else {
    Deno.writeFileSync(outPath, outFont);
  }
}

main();
