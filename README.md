# Print OpenAPI [![NPM Package](https://img.shields.io/npm/v/print-openapi)](https://www.npmjs.com/package/print-openapi) [![MIT License](https://img.shields.io/npm/l/print-openapi)](./LICENSE)

This tool takes an OpenAPI file and spits out a printable, static HTML file. Since most browsers have a 'Print to PDF' function, you can use this to generate nice PDFs of your OpenAPI specs.

**Why?**

Most OpenAPI tooling focuses on creating fancy displays that you can click on, send API requests with, etc. But sometimes you just need a plain, easily-readable, and static copy of your API docs. We needed that here at [Sendle](https://www.sendle.com/), so we built this tool!

**How?**

The tool uses the OpenAPI tooling released by [ReadMe](https://github.com/readmeio). Go check them out if you're after a nice developer hub – their offering is pretty cool!

## Installation

...

## Usage

```
print-openapi <openapi-file> <output-file>

Options:
  --tags=list,of,tags      Only these endpoints/pages will be in the output.
```

The OpenAPI file is your OpenAPI file.

The Output file is where the generated HTML will go.

`--tags` refers to the tags that can be assigned to [OpenAPI operations](https://spec.openapis.org/oas/v3.1.0#operation-object), and to our custom markdown pages as defined by our extension below. (note, not working right now, but hopefully it will work soon 🙏)

## OpenAPI extensions

...

## License

Released under the MIT license. See [LICENSE](./LICENSE) for details.
