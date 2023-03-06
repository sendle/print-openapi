import { command, run, string, positional, flag, boolean, multioption, array } from 'cmd-ts';
import { ExistingPath } from 'cmd-ts/batteries/fs';
import { exit } from 'process';
import { printTable } from 'console-table-printer';
import slugify from 'slugify';

import { loadOASToHTML, loadOASToMultipleHTML, derefOAS, derefOASMultiple, getOASTags, PathAndTags } from './lib/convertOAS';

async function showOASTags(openapiPath: string) {
  const tags = await getOASTags(openapiPath);

  printTable(tags);
}

async function getPathPerTag(openapiPath: string, outputPath: string, inputTags: string[]): Promise<PathAndTags[]> {
  if (!outputPath.includes('<tag>')) {
    console.error('Output path must include "<tag>" for substitution');
    exit(1);
  }

  const tags = await getOASTags(openapiPath);

  const pandt: PathAndTags[] = [];
  tags.forEach(tag => {
    if (inputTags.length === 0 || inputTags.includes(tag.Tag)) {
      pandt.push({
        path: outputPath.replace('<tag>', slugify(tag.Tag)),
        tags: [tag.Tag]
      });
    }
  });

  return pandt
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
  handler: async ({ subcommand, openapiPath, outputPath, showTags, tags }) => {
    if (showTags) {
      showOASTags(openapiPath);
    } else if (subcommand === 'deref') {
      derefOAS(openapiPath, outputPath, tags);
    } else if (subcommand === 'deref-per-tag') {
      const pathTagList: PathAndTags[] = await getPathPerTag(openapiPath, outputPath, tags);

      derefOASMultiple(openapiPath, pathTagList);
    } else if (subcommand === 'export-html') {
      loadOASToHTML(openapiPath, outputPath, tags);
    } else if (subcommand === 'export-html-per-tag') {
      const pathTagList: PathAndTags[] = await getPathPerTag(openapiPath, outputPath, tags);

      loadOASToMultipleHTML(openapiPath, pathTagList);
    } else {
      console.error('Subcommand not recognised')
      exit(1);
    }
  },
});

run(app, process.argv.slice(2));
