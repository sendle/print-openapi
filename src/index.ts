import { command, run, string, positional } from 'cmd-ts';
import { ExistingPath } from 'cmd-ts/batteries/fs';
import OASNormalize from 'oas-normalize';

import { convertToHTML } from './lib/convertOAS';

async function transformOAS(openapiPath: string, htmlPath: string) {
  // load openapi spec
  const oasLoader = new OASNormalize(openapiPath, {
    enablePaths: true,
    colorizeErrors: true,
  });

  oasLoader
    .deref()
    .then((definition) => {
      // successfully dereferenced, now convert it
      const content = convertToHTML(definition);

      console.log(content);
    })
    .catch((err) => {
      console.log(err);
    });
}

const app = command({
  name: 'print-openapi',
  description:
    'Turn an OpenAPI file into a printable HTML file.\n>\n> print-openapi [options] <openapi-path> <html-path>',
  args: {
    openapiPath: positional({
      type: ExistingPath,
      displayName: 'openapi-path',
      description: 'Path to your OpenAPI file.',
    }),
    htmlPath: positional({
      type: string,
      displayName: 'html-path',
      description: 'Where to output the HTML file.',
    }),
  },
  handler: ({ openapiPath, htmlPath }) => {
    transformOAS(openapiPath, htmlPath);
  },
});

run(app, process.argv.slice(2));
