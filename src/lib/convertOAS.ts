import { html } from '@readme/markdown';
import ejs from 'ejs';
import { readFileSync, writeFile } from 'fs';
import hljs from 'highlight.js';
import mime from 'mime-types';
import Oas from 'oas';
import OASNormalize from 'oas-normalize';
import { ResponseObject } from 'oas/dist/rmoas.types';
import type { OpenAPI } from 'openapi-types';
import path, { dirname } from 'path';
import { chdir, cwd } from 'process';
import sass from 'sass';

export interface Tag {
  Tag: string,
  Description: string,
}

export interface PathAndTags {
  path: string,
  tags: string[],
}

export interface Logo {
  active: boolean,
  mime: string,
  content: string,
  url: string,
  altText: string,
}

export interface Page {
  name: string,
  slug: string,
  tags: string[],
  content: string,
  // pages: Page[],
}

export async function convertToHTML(
  openapiInput: OpenAPI.Document,
  tags: string[],
): Promise<string> {
  // get info from the openapi file
  const doc = new Oas(JSON.parse(JSON.stringify(openapiInput)));

  // metadata
  const description = doc.api.info.description
    ? html(doc.api.info.description)
    : '';

  // parse pages
  const x_pages: Page[] = [];

  if (doc.hasExtension('x-pages') && Array.isArray(doc.getExtension('x-pages'))) {
    const pages = doc.getExtension('x-pages') as Page[];

    pages.forEach(page => {
      if (page.slug === undefined || page.slug === '') {
        //TODO: slugify and keep track of all existing page slugs used
        page.slug = 'todo';
      }
      if (tags.length === 0) {
        x_pages.push(page);
      } else {
        for (const tag of page.tags) {
          if (tags.includes(tag)) {
            x_pages.push(page)
            break
          }
        }
      }
    });
  }

  // parse operations
  const paths: any[] = [];

  Object.values(doc.getPaths()).forEach((path) => {
    const operations: any[] = [];
    let pathName = '';
    Object.values(path).forEach((operation) => {
      // make sure operation can be documented
      if (tags.length > 0) {
        for (const tag_info of operation.getTags()) {
          if (!tags.includes(tag_info.name)) {
            // it can't be, skip it
            return
          }
        }
      }

      const param_types: { [name: string]: number } = {
        header: 0,
        path: 0,
        query: 0,
      };

      if (operation.getParameters()) {
        operation.getParameters().forEach((param) => {
          param_types[param.in] += 1;
        });
      }

      const params_as_schema: { [name: string]: object } = {};
      if (operation.getParametersAsJSONSchema()) {
        operation.getParametersAsJSONSchema().forEach((group) => {
          params_as_schema[group.type] = group;
        });
      }

      const responses: { [statusCode: string]: boolean | ResponseObject } = {}
      operation.getResponseStatusCodes().forEach(statusCode => {
        responses[statusCode] = operation.getResponseByStatusCode(statusCode);
      });

      operations.push({
        name: operation.getSummary(),
        path: operation.path,
        method: operation.method,
        description: html(operation.getDescription()),
        security: operation.getSecurityWithTypes(true),
        param_types,
        params: operation.getParameters(),
        params_as_schema,
        body: operation.getRequestBody(),
        responseStatusCodes: operation.getResponseStatusCodes(),
        responses,
        responseExamples: operation.getResponseExamples(),
        servers: operation.schema.servers, //todo: get path servers
      });
      pathName = operation.path;
      // operation.getParameters().forEach((param) => {
      //   console.log(param.name);
      //   console.dir(param);
      //   console.log('');
      // });
      // console.dir(responses);
      // console.dir(operation);
    });
    if (operations.length > 0) {
      paths.push({
        path: pathName,
        operations,
      });
    }
  });

  // compile our sass
  const css = sass.compile(path.join(__dirname, '../assets/style.scss'));

  // get icon
  const logo: Logo = {
    active: false,
    mime: "",
    content: "",
    url: "",
    altText: "logo",
  };
  
  const xLogo = (doc.getDefinition().info as any)['x-logo'];
  if (xLogo) {
    if (xLogo.altText) {
      logo.altText = xLogo.altText;
    }
    if (xLogo.path) {
      const lookedUpMime = mime.lookup(xLogo.path);
      if (lookedUpMime) {
        logo.active = true;
        logo.mime = lookedUpMime;
        logo.content = readFileSync(xLogo.path, {encoding: 'base64'});
      } else {
        throw Error('Could not find mime type for logo, try adding a file extension to the logo file');
      }
    } else if (xLogo.url) {
      logo.active = true;
      logo.url = xLogo.url;
    } else {
      throw Error('Logo defined but no path or url');
    }
  }

  // put it all together
  return ejs.renderFile(path.join(__dirname, '../assets/index.ejs'), {
    logo,
    title: doc.getDefinition().info.title,
    description,
    externalDocs: doc.api.externalDocs,
    servers: doc.api.servers,
    style: css.css,
    paths,
    extra_pages: x_pages,
    unofficial: (doc.getDefinition().info as any)['x-unofficialSpec'] !== undefined,
    md_to_html: html,
    hljs,
  });
}

function postProcessDefinition(definition: OpenAPI.Document, tags: string[]): OpenAPI.Document {
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
      for (const tag of page.tags) {
        if (tags.includes(tag)) {
          new_pages.push(page);
          break;
        }
      }
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
          for (const tag of ((oper_info as any).tags as string[])) {
            if (tags.includes(tag)) {
              new_operations[oper_name] = oper_info
              break
            }
          }
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

export async function loadOASToHTML(openapiPath: string, htmlPath: string, tags: string[], callback?: Function) {
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
      // successfully dereferenced, now convert it
      const content = await convertToHTML(definition, tags);
      
      // move back to the original working directory we were executed in.
      // only do it after convertToHTML because convertToHTML may load
      //  file paths
      chdir(oldcwd);

      writeFile(htmlPath, content, (err) => {
        if (err) {
          console.error(err);
        }

        if (callback) {
          callback();
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

export async function loadOASToMultipleHTML(openapiPath: string, pathTagList: PathAndTags[]) {
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

      // convert and output them
      pathTagList.forEach(async info => {
        // in case we load a logo path in convertToHTML
        chdir(dirname(openapiPath));
        const content = await convertToHTML(definition, info.tags);

        // move back to the original working directory we were executed in
        //  to export files properly
        chdir(oldcwd);

        writeFile(info.path, content, (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

export async function derefOAS(openapiPath: string, outputPath: string, tags: string[], callback?: Function) {
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
      if ((definition as any).components !== undefined && (definition as any).components.responses !== undefined) {
        delete (definition as any).components.responses;
      }

      // output the pretty openapi file
      writeFile(outputPath, JSON.stringify(definition, null, 2), (err) => {
        if (err) {
          console.error(err);
        }
        
        if (callback) {
          callback();
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

export async function derefOASMultiple(openapiPath: string, pathTagList: PathAndTags[]) {
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

      // convert and output them
      pathTagList.forEach(async info => {
        // process tags
        const newDef = postProcessDefinition(definition, info.tags);

        // remove all schemas because we can't go chase down whether every schema is used given the current tags
        if ((newDef as any).components !== undefined && (newDef as any).components.schemas !== undefined) {
          delete (newDef as any).components.schemas;
        }
        if ((newDef as any).components !== undefined && (newDef as any).components.responses !== undefined) {
          delete (newDef as any).components.responses;
        }

        // output the pretty openapi file
        writeFile(info.path, JSON.stringify(newDef, null, 2), (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

export async function getOASTags(openapiPath: string): Promise<Tag[]> {
  // load openapi spec
  const oasLoader = new OASNormalize(openapiPath, {
    enablePaths: true,
    colorizeErrors: true,
  });

  // temporarily change to folder the openapi file is in so that we can deref
  //  all the refs in it properly
  const oldcwd = cwd();
  chdir(dirname(openapiPath));
  
  const definition = await oasLoader.deref();
  
  // move back to the original working directory we were executed in
  chdir(oldcwd);

  let tags: Tag[] = []
  definition.tags?.forEach(tag => {
    tags.push({
      Tag: tag.name,
      Description: tag.description || ''
    });
  });

  return tags;
}
