import { command, run, string, positional, flag, boolean, multioption, array } from 'cmd-ts';
import { ExistingPath } from 'cmd-ts/batteries/fs';
import OASNormalize from 'oas-normalize';
import { writeFile } from 'fs';
import { cwd, chdir } from 'process';
import { dirname } from 'path';
import type { OpenAPI } from 'openapi-types';

import { convertToHTML, Page } from './lib/convertOAS';

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

function postProcessDefinition(definition: OpenAPI.Document, tags: string[]) {
  if (tags.length === 0) {
    // we don't need to do anything
    return definition
  }

  // only include allowed tags in tag list, to not leak internal info
  if (definition.tags) {
    const new_tag_infos: any[] = [];

    definition.tags.forEach(tag_info => {
      if (tags.includes(tag_info.name)) {
        new_tag_infos.push(tag_info);
      }
    });

    definition.tags = new_tag_infos;
  }

  // only include pages with the given tags
  if ((definition as any)["x-pages"] !== undefined) {
    const old_pages = (definition as any)["x-pages"] as Page[]
    const new_pages: Page[] = [];

    old_pages.forEach(page => {
      page.tags.forEach(tag => {
        if (tags.includes(tag)) {
          new_pages.push(page);
          return;
        }
      });
    });

    // console.log(`pages: [${old_pages.map(page => page.name)}] => [${new_pages.map(page => page.name)}]`);

    (definition as any)["x-pages"] = new_pages;
  }

  // only include operations with the given tags
  if (definition.paths !== undefined) {
    for (const [path_name, operations] of Object.entries(definition.paths)) {
      const new_operations: any = {};

      for (const [oper_name, oper_info] of Object.entries(operations)) {
        if ((oper_info as any).tags !== undefined) {
          ((oper_info as any).tags as string[]).forEach(tag => {
            if (tags.includes(tag)) {
              new_operations[oper_name] = oper_info
              return
            }
          });
        }
      }

      // console.log(`${path_name}: [${Object.keys(operations)}] => [${Object.keys(new_operations)}]`)

      if (Object.keys(new_operations).length > 0) {
        definition.paths[path_name] = new_operations;
      } else {
        // only share used paths :)
        delete definition.paths[path_name];
      }
    }
  }

  return definition;
}

async function derefOAS(openapiPath: string, outputPath: string, tags: string[]) {
  // load openapi spec
  const oasLoader = new OASNormalize(openapiPath, {
    enablePaths: true,
    colorizeErrors: true,
  });

  // temporarily change to folder the openapi file is in so that we can deref
  //  all the refs in it properly
  const oldcwd = cwd();
  chdir(dirname(openapiPath));

  // here we deref instead of bundle because: tags mean we could include internal components
  //  if we just bundle. when we deref we can remove all component schemas for safety.
  oasLoader
    .deref()
    .then(async (definition) => {
      // move back to the original working directory we were executed in
      chdir(oldcwd);

      // process tags
      definition = postProcessDefinition(definition, tags);

      // remove all schemas because we can't go chase down whether every schema is used given the current tags
      if ((definition as any).components !== undefined && (definition as any).components.schemas !== undefined) {
        delete (definition as any).components.schemas;
      }

      // output the pretty openapi file
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

async function transformOASToHTML(openapiPath: string, htmlPath: string, tags: string[]) {
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
      const content = await convertToHTML(definition, tags);

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
      transformOASToHTML(openapiPath, outputPath, tags);
    } else {
      console.error('Subcommand not recognised')
    }
  },
});

run(app, process.argv.slice(2));
