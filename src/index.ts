import { command, run, string, positional, flag, boolean } from 'cmd-ts';
import { ExistingPath } from 'cmd-ts/batteries/fs';
import OASNormalize from 'oas-normalize';
import { writeFile } from 'fs';
import { cwd, chdir } from 'process';
import { dirname } from 'path';

import { convertToHTML } from './lib/convertOAS';

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
      let info = [['Tag', 'Description']]
      definition.tags?.forEach(tag => {
        info.push([tag.name, tag.description || '']);
      });
      // this looks bad, but oh well
      console.table(info);
    })
    .catch((err) => {
      console.log(err);
    });
}

async function bundleOAS(openapiPath: string, outputPath: string) {
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
    .bundle()
    .then(async (definition) => {
      // move back to the original working directory we were executed in
      chdir(oldcwd);

      // output the pretty bundled openapi file
      writeFile(outputPath, JSON.stringify(definition, null, 2), (err) => {
        if (err) {
          console.error(err);
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

async function transformOASToHTML(openapiPath: string, htmlPath: string) {
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
      // move back to the original working directory we were executed in
      chdir(oldcwd);

      // successfully dereferenced, now convert it
      const content = await convertToHTML(definition);

      writeFile(htmlPath, content, (err) => {
        if (err) {
          console.error(err);
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

const app = command({
  name: 'print-openapi',
  description:
    'Turn an OpenAPI file into a printable HTML file.\n>\n> print-openapi export-html [options] <openapi-path> <html-path>\n> print-openapi bundle-openapi [options] <openapi-path> <output-json-path>',
  args: {
    subcommand: positional({
      type: string,
      displayName: 'subcommand',
      description: 'What to do. Either export-html or bundle-openapi.',
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
      description: 'List all tags in the OpenAPI file',
    }),
  },
  handler: ({ subcommand, openapiPath, outputPath, showTags }) => {
    if (showTags) {
      showOASTags(openapiPath);
    } else if (subcommand === 'bundle-openapi') {
      bundleOAS(openapiPath, outputPath);
    } else if (subcommand === 'export-html') {
      transformOASToHTML(openapiPath, outputPath);
    } else {
      console.error('Subcommand not recognised')
    }
  },
});

run(app, process.argv.slice(2));
