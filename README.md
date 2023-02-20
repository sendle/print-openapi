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
$ print-openapi export-html [options] <openapi-path> <html-path>
exports a printable HTML file.

$ print-openapi deref [options] <openapi-path> <output-json-path>
exports a new OpenAPI file with all references resolved.

Note: deref intentionally removes all schemas to ensure that internal
info isn't leaked in the new OpenAPI file.

Options:
  --tag=tag1   -t tag2    Only these operations/pages will be included in the output.
```

### Tags

`--tag` and `-t` refer to the tags that can be assigned to [OpenAPI operations](https://spec.openapis.org/oas/v3.1.0#operation-object), and to our custom markdown pages as defined our [`x-pages` extension](openapi-extensions.md#x-pages).

When using `print-openapi`, by default all pages and operations are exported. However, when tags are specified the tool will only include pages and operations with those tags. See the example specs in [`/examples/`](examples/).

## License

Released under the MIT license. See [LICENSE](./LICENSE) for details.
