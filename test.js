import * as fontconv from "./mod.js";
import { assertEquals } from "@std/assert";

async function getName(uint8Array, code) {
  const font = await fontconv.getFont(uint8Array);
  const glyphIndex = font.encoding.cmap.glyphIndexMap[Number(code)];
  const glyph = font.glyphs.get(glyphIndex.toString());
  return glyph.name;
}

async function getLigature(uint8Array, code) {
  const font = await fontconv.getFont(uint8Array);
  const glyphIndex = font.encoding.cmap.glyphIndexMap[Number(code)];
  const ligatureMap = fontconv.getLigatureMap(font, "by");
  return ligatureMap[glyphIndex].name;
}

Deno.test("Format check", () => {
  const otf = Deno.readFileSync("test/format-check.otf");
  const ttf = Deno.readFileSync("test/format-check.ttf");
  const eot = Deno.readFileSync("test/format-check.eot");
  const svg = Deno.readTextFileSync("test/format-check.svg");
  const woff = Deno.readFileSync("test/format-check.woff");
  const woff2 = Deno.readFileSync("test/format-check.woff2");
  assertEquals(fontconv.isOTF(otf), true);
  assertEquals(fontconv.isOTF(ttf), false);
  assertEquals(fontconv.isOTF(eot), false);
  assertEquals(fontconv.isOTF(svg), false);
  assertEquals(fontconv.isOTF(woff), false);
  assertEquals(fontconv.isOTF(woff2), false);
  assertEquals(fontconv.isTTF(otf), false);
  assertEquals(fontconv.isTTF(ttf), true);
  assertEquals(fontconv.isTTF(eot), false);
  assertEquals(fontconv.isTTF(svg), false);
  assertEquals(fontconv.isTTF(woff), false);
  assertEquals(fontconv.isTTF(woff2), false);
  assertEquals(fontconv.isEOT(otf), false);
  assertEquals(fontconv.isEOT(ttf), false);
  assertEquals(fontconv.isEOT(eot), true);
  assertEquals(fontconv.isEOT(svg), false);
  assertEquals(fontconv.isEOT(woff), false);
  assertEquals(fontconv.isEOT(woff2), false);
  assertEquals(fontconv.isSVG(otf), false);
  assertEquals(fontconv.isSVG(ttf), false);
  assertEquals(fontconv.isSVG(eot), false);
  assertEquals(fontconv.isSVG(svg), true);
  assertEquals(fontconv.isSVG(woff), false);
  assertEquals(fontconv.isSVG(woff2), false);
  assertEquals(fontconv.isWOFF(otf), false);
  assertEquals(fontconv.isWOFF(ttf), false);
  assertEquals(fontconv.isWOFF(eot), false);
  assertEquals(fontconv.isWOFF(svg), false);
  assertEquals(fontconv.isWOFF(woff), true);
  assertEquals(fontconv.isWOFF(woff2), false);
  assertEquals(fontconv.isWOFF2(otf), false);
  assertEquals(fontconv.isWOFF2(ttf), false);
  assertEquals(fontconv.isWOFF2(eot), false);
  assertEquals(fontconv.isWOFF2(svg), false);
  assertEquals(fontconv.isWOFF2(woff), false);
  assertEquals(fontconv.isWOFF2(woff2), true);
});
Deno.test("Input check", async () => {
  const otf = await Deno.readFile("test/format-check.otf");
  const ttf = await Deno.readFile("test/format-check.ttf");
  // const eot = await Deno.readFile("test/format-check.eot");
  const svg = await Deno.readTextFile("test/format-check.svg");
  const woff = await Deno.readFile("test/format-check.woff");
  const woff2 = await Deno.readFile("test/format-check.woff2");
  const options = { code: "0xe88a" };
  const otfttf = await fontconv.convert(otf, ".ttf", options);
  const ttfttf = await fontconv.convert(ttf, ".ttf", options);
  // const eotttf = await fontconv.convert(eot, ".ttf", options);
  const svgttf = await fontconv.convert(svg, ".ttf", options);
  const woffttf = await fontconv.convert(woff, ".ttf", options);
  const woff2ttf = await fontconv.convert(woff2, ".ttf", options);
  assertEquals(fontconv.isTTF(otfttf), true);
  assertEquals(fontconv.isTTF(ttfttf), true);
  // assertEquals(fontconv.isTTF(eotttf), true);
  assertEquals(fontconv.isTTF(svgttf), true);
  assertEquals(fontconv.isTTF(woffttf), true);
  assertEquals(fontconv.isTTF(woff2ttf), true);
});
Deno.test("Output check", async () => {
  const font = Deno.readFileSync("test/material-icons.woff2");
  const options = { code: "0xe88a" };
  const otf = await fontconv.convert(font, ".otf", options);
  const ttf = await fontconv.convert(font, ".ttf", options);
  const eot = await fontconv.convert(font, ".eot", options);
  const svg = await fontconv.convert(font, ".svg", options);
  const woff = await fontconv.convert(font, ".woff", options);
  const woff2 = await fontconv.convert(font, ".woff2", options);
  assertEquals(fontconv.isOTF(otf), true);
  assertEquals(fontconv.isTTF(ttf), true);
  assertEquals(fontconv.isEOT(eot), true);
  assertEquals(fontconv.isSVG(svg), true);
  assertEquals(fontconv.isWOFF(woff), true);
  assertEquals(fontconv.isWOFF2(woff2), true);
});
Deno.test("Options check1", async () => {
  const font1 = Deno.readFileSync("test/bootstrap-icons.woff2");
  const name = "alarm";
  const code = "0xf102";
  const text = String.fromCharCode(code);
  const ttf1 = await fontconv.convert(font1, ".ttf", { code });
  assertEquals(await getName(ttf1, code), name);
  const ttf2 = await fontconv.convert(font1, ".ttf", { text });
  assertEquals(await getName(ttf2, code), name);
  const ttf3 = await fontconv.convert(font1, ".ttf", { name });
  assertEquals(await getName(ttf3, code), name);
});
Deno.test("Options check2", async () => {
  const font = Deno.readFileSync("test/material-icons.woff2");
  const ligature = "home";
  const code = "0xe88a";
  const ttf = await fontconv.convert(font, ".ttf", { ligature });
  assertEquals(await getLigature(ttf, code), ligature);
});
Deno.test("Name check", async () => {
  const font = Deno.readFileSync("test/bootstrap-icons.woff2");
  const name = "alarm";
  const options = { code: "0xf102", removeNotDef: true };
  const otf = await fontconv.convert(font, ".otf", options);
  const ttf = await fontconv.convert(font, ".ttf", options);
  const svg = await fontconv.convert(font, ".svg", options);
  const woff = await fontconv.convert(font, ".woff", options);
  const woff2 = await fontconv.convert(font, ".woff2", options);
  const code = Number(options.code);
  assertEquals(await getName(otf, code), name);
  assertEquals(await getName(ttf, code), name);
  assertEquals(await getName(svg, code), name);
  assertEquals(await getName(woff, code), name);
  assertEquals(await getName(woff2, code), name);
});
Deno.test("Ligature check (opentype.js)", async () => {
  const file = Deno.readFileSync("test/material-icons.woff2");
  const options1 = { code: "0xe88a" };
  const ttf1 = await fontconv.convert(file, ".ttf", options1);
  const font1 = await fontconv.getFont(ttf1);
  const ligatures1 = fontconv.getLigatureMap(font1, "by");
  const values1 = Object.values(ligatures1);
  assertEquals(values1.length, 1);
  assertEquals(values1[0].name, "home");

  const options2 = { code: "0xe88a", removeLigatures: true };
  const ttf2 = await fontconv.convert(file, ".ttf", options2);
  const font2 = await fontconv.getFont(ttf2);
  const ligatures2 = fontconv.getLigatureMap(font2, "by");
  const values2 = Object.values(ligatures2);
  assertEquals(values2.length, 0);

  const char = String.fromCodePoint(Number(options1.code));
  const glyph1 = font1.charToGlyph(char);
  const glyph2 = font2.charToGlyph(char);
  assertEquals(glyph1.name, "home");
  assertEquals(glyph2.name, "");

  const path1 = glyph1.path.toPathData();
  const path2 = glyph2.path.toPathData();
  assertEquals(path1, path2);
});
Deno.test("Ligature check (svg2ttf)", async () => {
  const file = Deno.readFileSync("test/material-icons.woff2");
  const options = { code: "0xe88a" };
  const svg = await fontconv.convert(file, ".svg", options);
  const ttf = await fontconv.convert(svg, ".ttf", options);
  const font = await fontconv.getFont(ttf);
  const ligatures = fontconv.getLigatureMap(font, "by");
  const values = Object.values(ligatures);
  assertEquals(values.length, 1);
  assertEquals(values[0].name, "home");
});
