# Print OpenAPI [![NPM Package](https://img.shields.io/npm/v/print-openapi)](https://www.npmjs.com/package/print-openapi) [![MIT License](https://img.shields.io/npm/l/print-openapi)](./LICENSE) [![Tests](https://github.com/sendle/print-openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/sendle/print-openapi/actions/workflows/ci.yml)

This tool takes an OpenAPI file and spits out a printable, static HTML file. Since most browsers have a 'Print to PDF' function, you can use this to generate nice PDFs of your OpenAPI specs.

**Why?**

Most OpenAPI tooling focuses on creating fancy displays that you can click on, send API requests with, etc. But sometimes you just need a plain, easily-readable, and static copy of your API docs. We needed that here at [Sendle](https://www.sendle.com/) for our internal documentation, so we built this tool!

**How?**

The tool uses the OpenAPI tooling released by [ReadMe](https://github.com/readmeio). Go check them out if you're after a nice developer hub – their offering is pretty cool!

## Installation

```
$ npm install -g print-openapi
```

## Usage

```
$ print-openapi export-html bbs-openapi.yaml bbs-openapi.html
```

Generate a printable HTML file from the `bbs-openapi.yaml` OpenAPI file, including all paths and pages.

```
$ print-openapi export-html --tag moderation bbs-openapi.yaml bbs-moderation-openapi.html
```

Generate a printable HTML file from the `bbs-openapi.yaml` OpenAPI file, only including paths and pages that have the `moderation` tag.


```
$ print-openapi deref --tag system-messages --tag sysmsgv2 bbs-openapi.yaml ../sysmsg.openapi.json
```

Create a new OpenAPI file called `sysmsg.openapi.json`. This file only contains the paths and pages from `bbs-openapi.yaml` with either the `system-messages` or `sysmsgv2` tags.

### Markdown pages

We've defined the [`x-pages` extension](openapi-extensions.md#x-pages), which lets you define arbitrary markdown pages to be displayed on the exported HTML files. See the bottom of that extension page for our future plans with it!

### Tags

`--tag` and `-t` refer to the tags that can be assigned to [OpenAPI operations](https://spec.openapis.org/oas/v3.1.0#operation-object), and to our custom markdown pages as defined our [`x-pages` extension](openapi-extensions.md#x-pages).

When using `print-openapi`, by default all pages and operations are exported. However, when tags are specified the tool will only include pages and operations with those tags. See the example specs in [`/examples/`](examples/).

## License

Released under the MIT license. See [LICENSE](./LICENSE) for details.
