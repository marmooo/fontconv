# fontconv

Convert and compress fonts (.ttf, .otf, .eot, .svg, .woff, .woff2).

## Installation

### Deno

```
deno install -fr -RWE -g npm:fontconv
```

### Node

```
npm install fontconv -g
```

## Usage

```
import { convert } from "fontconv";

const options = { text: "abcdef" };
const inFont = Deno.readFileSync(inPath);
const outFont = await convert(inFont, ".woff2", options);
Deno.writeFileSync(outPath, outFont);
```

### CLI

```
Usage: fontconv [options] <input> <output>

Convert and compress fonts (.ttf, .otf, .eot, .svg, .woff, .woff2).

Arguments:
  input                   Path of input font file
  output                  Path of output font file

Options:
  -V, --version           output the version number
  --text <string>         characters to compress
  --text-file <path>      Path of line separated character file to compress
  --code <string>         comma separated codepoints to compress
  --code-file <path>      Path of line separated codepoint file to compress
  --name <string>         comma separated glyph names to compress
  --name-file <path>      Path of line separated glyph name file to compress
  --ligature <string>     comma separated ligatures to compress
  --ligature-file <path>  Path of line separated ligature file to compress
  --remove-ligatures      remove ligatures associated with the glyphs
  -h, --help              display help for command
```

### Examples

```
fontconv in.ttf out.woff
fontconv in.woff2 out.otf
fontconv --text abcdef in.ttf out.woff2
fontconv --text-file charaters.lst in.ttf out.woff2
fontconv --code 0x61,98 in.ttf out.woff2
fontconv --code-file codepoints.lst in.ttf out.woff2
fontconv --name alarm,box in.otf out.woff
fontconv --name-file names.lst in.otf out.woff
fontconv --ligature home,menu --remove-ligatures in.otf out.woff
fontconv --ligature-file ligatures.lst in.otf out.woff
```

`codepoints.lst`

```
0xe88a
59448
```

## License

MIT
