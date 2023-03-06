import { command, run, string, positional, flag, boolean, multioption, array } from 'cmd-ts';
import { ExistingPath } from 'cmd-ts/batteries/fs';
import OASNormalize from 'oas-normalize';
import { cwd, chdir } from 'process';
import { dirname } from 'path';
import { printTable } from 'console-table-printer';

import { loadOASToHTML, derefOAS } from './lib/convertOAS';

async function showOASTags(openapiPath: string) {
  // load openapi spec
  const oasLoader = new OASNormalize(openapiPath, {
    enablePaths: true,
    colorizeErrors: true,
  });

  // temporarily change to folder the openapi file is in so that we can deref
  //  all the refs in it properly
  const oldcwd = cwd();
  chdir(dirname(openapiPath));

  oasLoader
    .deref()
    .then(async (definition) => {
      let info: any[] = []
      definition.tags?.forEach(tag => {
        info.push({
          Tag: tag.name,
          Description: tag.description || ''
        });
      });
      // this looks bad, but oh well
      printTable(info);
    })
    .catch((err) => {
      console.log(err);
    });
}

const app = command({
  name: 'print-openapi',
  description:
`Turn an OpenAPI file into a printable HTML file.

$ print-openapi export-html [options] <openapi-path> <html-path>
exports a printable HTML file.

$ print-openapi deref [options] <openapi-path> <output-json-path>
exports a new OpenAPI file with all references dereferenced.

Note: deref intentionally removes all schemas to ensure that internal
info isn't leaked in the new OpenAPI file.`,
  args: {
    subcommand: positional({
      type: string,
      displayName: 'subcommand',
      description: 'What to do. Either export-html or deref.',
    }),
    openapiPath: positional({
      type: ExistingPath,
      displayName: 'openapi-path',
      description: 'Path to your OpenAPI file.',
    }),
    outputPath: positional({
      type: string,
      displayName: 'output-path',
      description: 'Where to output the file.',
    }),
    showTags: flag({
      type: boolean,
      long: 'list-tags',
      short: 'l',
      description: 'List all tags in the OpenAPI file.',
    }),
    tags: multioption({
      type: array(string),
      long: 'tag',
      short: 't',
      description: 'Tag to include in the output file. Can be given multiple times for multiple tags.',
    }),
  },
  handler: ({ subcommand, openapiPath, outputPath, showTags, tags }) => {
    if (showTags) {
      showOASTags(openapiPath);
    } else if (subcommand === 'deref') {
      derefOAS(openapiPath, outputPath, tags);
    } else if (subcommand === 'export-html') {
      loadOASToHTML(openapiPath, outputPath, tags);
    } else {
      console.error('Subcommand not recognised')
    }
  },
});

run(app, process.argv.slice(2));
