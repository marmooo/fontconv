import { compress, decompress } from "npm:wawoff2@2.0.1";
import { Font, parse } from "npm:opentype.js@1.3.4";
import { font2svgFont, ttf2svgFont } from "npm:@marmooo/ttf2svg@0.1.8";
import svg2ttf from "npm:svg2ttf@6.0.3";
import ttf2eot from "npm:ttf2eot@3.1.0";
import ttf2woff from "npm:ttf2woff@3.0.0";
// import ttf2woff2 from "npm:ttf2woff2@5.0.0";
// import * as fonteditor from "npm:fonteditor-core@2.3.3"; // glyph names are lost

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

function getGlyphString(options) {
  if (options.textFile) {
    const text = Deno.readTextFileSync(options.textFile);
    return text.trimEnd().replace(/\n/g, "");
  } else if (options.codeFile) {
    const text = Deno.readTextFileSync(options.codeFile);
    return text.trimEnd().split("\n")
      .map((line) => String.fromCodePoint(Number(line))).join("");
  } else if (options.text) {
    return options.text;
  } else if (options.code) {
    return options.code.split(",")
      .map((code) => String.fromCodePoint(Number(code))).join("");
  } else {
    return undefined;
  }
}

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
  const svg = font2svgFont(font);
  if (format === ".svg") return svg;
  const ttf = svg2ttf(svg).buffer;
  switch (format) {
    case ".otf": {
      const tempFont = parse(ttf.buffer);
      return new Uint8Array(tempFont.toArrayBuffer());
    }
    case ".ttf":
      return ttf;
    case ".eot":
      return ttf2eot(ttf);
    case ".woff":
      return ttf2woff(ttf);
    case ".woff2":
      // return ttf2woff2(ttf);
      return await compress(ttf);
    default:
      throw new Error(`${format} is not a supported format.`);
  }
}

export function filterGlyphs(font, options) {
  const glyphString = getGlyphString(options);
  if (glyphString) {
    return font.stringToGlyphs(glyphString);
  } else {
    return Object.values(font.glyphs.glyphs);
  }
}

function createTemporaryFont(font, glyphs) {
  const notdefGlyph = font.glyphs.get(0);
  const tempFont = new Font({
    familyName: font.names.fontFamily.en,
    styleName: font.names.fontSubfamily.en,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascender,
    descender: font.descender,
    glyphs: [notdefGlyph, ...glyphs],
  });
  tempFont.names = font.names;
  return tempFont;
}

export async function convert(fontContent, format, options) {
  const font = await getFont(fontContent);
  const glyphs = filterGlyphs(font, options);
  const tempFont = createTemporaryFont(font, glyphs);
  return await convertFormat(tempFont, format);
}
