# fontconv

Convert and compress fonts (.ttf, .otf, .eot, .svg, .woff, .woff2).

## Installation

### Deno

```
deno install -fr --allow-read --allow-write --name fontconv \
https://raw.githubusercontent.com/marmooo/fontconv/main/cli.js
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
  input               Path of input font file
  output              Path of output font file

Options:
  -V, --version       output the version number
  --text <string>     characters to compress
  --text-file <path>  Path of line separated character file to compress
  --code <string>     comma separated codepoints to compress
  --code-file <path>  Path of line separated codepoint file to compress
  -h, --help          display help for command
```

### Examples

```
fontconv in.ttf out.woff
fontconv in.woff2 out.otf
fontconv --text-file charaters.lst in.ttf out.woff2
fontconv --text abcdef in.ttf out.woff2
fontconv --code 0x61,98 in.ttf out.woff2
fontconv --code-file codepoints.lst in.ttf out.woff2
```

`codepoints.lst`

```
0xe88a
59448
```

## License

MIT
