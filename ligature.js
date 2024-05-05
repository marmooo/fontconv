function* parseCoverageFormat1(subtable, reverseGlyphIndexMap) {
  if (!subtable.ligatureSets) return;
  for (let i = 0; i < subtable.ligatureSets.length; i++) {
    for (const ligature of subtable.ligatureSets[i]) {
      const initialIndex = subtable.coverage.glyphs[i];
      const coverage1 = reverseGlyphIndexMap[initialIndex];
      const components = ligature.components.map((component) => {
        const codePoint = reverseGlyphIndexMap[component];
        return String.fromCharCode(codePoint);
      });
      const sub = [initialIndex, ...ligature.components];
      const name = String.fromCharCode(coverage1) + components.join("");
      yield { name, sub, by: ligature.ligGlyph };
    }
  }
}

function* parseCoverageFormat2(subtable, reverseGlyphIndexMap) {
  if (!subtable.ligatureSets) return;
  const coverage2 = [];
  subtable.coverage.ranges.forEach((coverage) => {
    for (let c = coverage.start; c <= coverage.end; c++) {
      coverage2.push(c);
    }
  });
  for (let i = 0; i < subtable.ligatureSets.length; i++) {
    for (const ligature of subtable.ligatureSets[i]) {
      const components = ligature.components.map((component) => {
        const codePoint = reverseGlyphIndexMap[component];
        return String.fromCharCode(codePoint);
      });
      const coverage = reverseGlyphIndexMap[coverage2[i]];
      const name = String.fromCharCode(coverage) + components.join("");
      const sub = [coverage2[i], ...ligature.components];
      yield { name, sub, by: ligature.ligGlyph };
    }
  }
}

// https://github.com/opentypejs/opentype.js/issues/384
// https://jsfiddle.net/nvbajtmo/
export function* parseLigatures(font) {
  const gsub = font.tables.gsub;
  if (!gsub) return;
  const glyphIndexMap = font.tables.cmap.glyphIndexMap;
  const reverseGlyphIndexMap = {};
  Object.keys(glyphIndexMap).forEach((codePoint) => {
    const value = glyphIndexMap[codePoint];
    reverseGlyphIndexMap[value] = codePoint;
  });
  for (const lookup of gsub.lookups) {
    for (const subtable of lookup.subtables) {
      const coverage = subtable.coverage;
      if (!coverage) continue;
      if (coverage.format === 1) {
        yield* parseCoverageFormat1(subtable, reverseGlyphIndexMap);
      } else {
        yield* parseCoverageFormat2(subtable, reverseGlyphIndexMap);
      }
    }
  }
}

export function getLigatureMap(font, key) {
  const map = {};
  for (const ligature of parseLigatures(font)) {
    map[ligature[key]] = ligature;
  }
  return map;
}
