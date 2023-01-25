import type { OpenAPI } from 'openapi-types';
import Oas from 'oas';
import { html } from '@readme/markdown';
import ejs from 'ejs';
import path from 'path';
import sass from 'sass';
import { ResponseObject } from 'oas/dist/rmoas.types';

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
      });
      pathName = operation.path;
      // operation.getParameters().forEach((param) => {
      //   console.log(param.name);
      //   console.dir(param);
      //   console.log('');
      // });
      // console.dir(responses);
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
    md_to_html: html,
  });
}
