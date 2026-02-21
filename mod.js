import { getLigatureMap } from "./ligature.js";
import { compress, decompress } from "wawoff2";
import { Font, parse } from "opentype.js";
import { filterGlyphs, font2svgFont, ttf2svgFont } from "@marmooo/ttf2svg";
import svg2ttf from "svg2ttf";
import ttf2eot from "ttf2eot";
import ttf2woff from "ttf2woff";
// import ttf2woff2 from "npm:ttf2woff2@5.0.0";
// import * as fonteditor from "npm:fonteditor-core@2.3.3"; // glyph names are lost

export { getLigatureMap };

export function isOTF(uint8Array) {
  return uint8Array[0] === 0x4F &&
    uint8Array[1] === 0x54 &&
    uint8Array[2] === 0x54 &&
    uint8Array[3] === 0x4F;
}

export function isTTF(uint8Array) {
  return uint8Array[0] === 0x00 &&
    uint8Array[1] === 0x01 &&
    uint8Array[2] === 0x00 &&
    uint8Array[3] === 0x00;
}

export function isEOT(uint8Array) {
  return uint8Array[34] === 0x4C && uint8Array[35] === 0x50;
}

export function isSVG(object) {
  return typeof object === "string";
}

export function isWOFF(uint8Array) {
  return uint8Array[0] === 0x77 &&
    uint8Array[1] === 0x4F &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x46;
}

export function isWOFF2(uint8Array) {
  return uint8Array[0] === 0x77 &&
    uint8Array[1] === 0x4F &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x32;
}

// glyph names are lost
//   difficult: OTF --> TTF
//   easy:      OTF --> SVG --> TTF
// export function otf2ttf(otf) {
//   const ttfObj = fonteditor.default.otf2ttfobject(otf);
//   const ttfBuffer = new fonteditor.default.TTFWriter().write(ttfObj);
//   return new Uint8Array(ttfBuffer);
// }
export function otf2ttf(otf) {
  const svg = ttf2svgFont(new Uint8Array(otf));
  return svg2ttf(svg).buffer;
}

// // TODO: not work
// export function eot2ttf(eot) {
//   const ttfObj = fonteditor.default.eot2ttf(eot.buffer);
//   const ttfBuffer = new fonteditor.default.TTFWriter().write(ttfObj);
//   return new Uint8Array(ttfBuffer);
// }

export async function getFont(fontContent) {
  if (isSVG(fontContent)) {
    const ttf = svg2ttf(fontContent);
    return parse(ttf.buffer.buffer);
  } else if (isWOFF2(fontContent)) {
    const data = await decompress(fontContent);
    return parse(Uint8Array.from(data).buffer);
  } else if (isEOT(fontContent)) {
    // const ttf = eot2ttf(fontContent);
    // return parse(ttf.buffer);
    throw new Error(".eot format input is no supported.");
  } else {
    return parse(fontContent.buffer);
  }
}

async function convertFormat(font, format) {
  if (format === ".svg") return font2svgFont(font);
  const binary = new Uint8Array(font.toArrayBuffer());

  // CFF (OTF) outlines cannot be stored in a .ttf file with correct magic bytes.
  // Fall back to svg2ttf via SVG font as an intermediate to perform
  // cubic-to-quadratic conversion (CFF -> glyf),
  // producing a proper glyf-based TTF. All other formats accept CFF as-is since
  // ttf2woff, ttf2eot, and wawoff2 do not inspect the outline type.
  if (format === ".ttf" && isOTF(binary)) {
    return svg2ttf(font2svgFont(font)).buffer;
  }
  switch (format) {
    case ".otf":
    case ".ttf":
      // .otf: Returns glyf-based outlines if input is TTF. True CFF conversion
      // (glyf -> CFF) is not supported in JavaScript yet. All modern environments
      // accept glyf outlines in an .otf container.
      return binary;
    case ".eot":
      return ttf2eot(binary);
    case ".woff":
      return ttf2woff(binary);
    case ".woff2":
      return await compress(binary);
    default:
      throw new Error(`${format} is not a supported format.`);
  }
}

export function getNameMap(font) {
  const map = {};
  for (const glyph of Object.values(font.glyphs.glyphs)) {
    map[glyph.name] = glyph.index;
  }
  return map;
}

function createTemporaryFont(font, glyphs) {
  const notdefGlyph = font.glyphs.get(0);
  notdefGlyph.name = ".notdef";

  // avoid the warning caused by opentype.js below
  // Undefined CHARARRAY encountered and treated as an empty string.
  glyphs.forEach((glyph) => {
    if (!glyph.name) glyph.name = "";
  });

  const tmpFont = new Font({
    familyName: font.names.fontFamily.en,
    styleName: font.names.fontSubfamily.en,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    glyphs: [notdefGlyph, ...glyphs],
  });
  tmpFont.names = font.names;
  return tmpFont;
}

function createLigaturesFont(font, glyphs) {
  const ligatureMap = getLigatureMap(font, "by");
  const charSet = new Set();
  for (const glyph of glyphs) {
    const ligature = ligatureMap[glyph.index];
    if (ligature) {
      Array.from(ligature.name).forEach((char) => {
        charSet.add(char);
      });
    }
  }
  glyphs.forEach((glyph) => {
    const char = String.fromCharCode(glyph.unicode);
    if (charSet.has(char)) charSet.delete(char);
  });

  const ligatureGlyphs = [];
  charSet.forEach((char) => {
    const unicode = char.codePointAt(0);
    const glyphIndex = font.encoding.cmap.glyphIndexMap[unicode];
    const glyph = font.glyphs.get(glyphIndex);
    ligatureGlyphs.push(glyph);
  });
  const newGlyphs = [...ligatureGlyphs, ...glyphs];
  const tmpFont = createTemporaryFont(font, newGlyphs);

  const charMap = {};
  newGlyphs.forEach((glyph, index) => {
    const char = String.fromCharCode(glyph.unicode);
    charMap[char] = index + 1;
  });
  glyphs.forEach((glyph, i) => {
    const ligature = ligatureMap[glyph.index];
    if (ligature) {
      const sub = Array.from(ligature.name)
        .map((char) => charMap[char]);
      const by = ligatureGlyphs.length + i + 1;
      tmpFont.substitution.addLigature("liga", { sub, by });
      glyph.name = ligature.name;
    }
  });

  const otf = tmpFont.toArrayBuffer();
  const newFont = parse(otf);
  return newFont;
}

function createFont(font, glyphs, options) {
  if (options.removeLigatures) {
    return createTemporaryFont(font, glyphs);
  } else {
    return createLigaturesFont(font, glyphs);
  }
}

export async function convert(fontContent, format, options = {}) {
  const font = await getFont(fontContent);
  const glyphs = filterGlyphs(font, options);
  if (glyphs.length < 1) {
    throw new Error(
      `No glyphs found for the given options: ${JSON.stringify(options)}`,
    );
  }
  const tempFont = createFont(font, glyphs, options);
  return await convertFormat(tempFont, format);
}
