import type { OpenAPI } from 'openapi-types';
import Oas from 'oas';
import { html } from '@readme/markdown';
import ejs from 'ejs';
import path from 'path';
import sass from 'sass';

export async function convertToHTML(
  openapiInput: OpenAPI.Document
): Promise<string> {
  // get info from the openapi file
  const doc = new Oas(JSON.parse(JSON.stringify(openapiInput)));

  // metadata
  const description = doc.api.info.description
    ? html(doc.api.info.description)
    : '';

  // parse operations
  const paths: any[] = [];

  Object.values(doc.getPaths()).forEach((path) => {
    const operations: any[] = [];
    let pathName = '';
    Object.values(path).forEach((operation) => {
      operations.push({
        name: operation.getSummary(),
        path: operation.path,
        method: operation.method,
        description: html(operation.getDescription()),
      });
      pathName = operation.path;
    });
    paths.push({
      path: pathName,
      operations,
    });
  });

  // compile our sass
  const css = sass.compile(path.join(__dirname, '../assets/style.scss'));

  // put it all together
  return ejs.renderFile(path.join(__dirname, '../assets/index.ejs'), {
    title: doc.getDefinition().info.title,
    description,
    style: css.css,
    paths,
  });
}
