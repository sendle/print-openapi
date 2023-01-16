import type { OpenAPI } from 'openapi-types';
import Oas from 'oas';
import { html } from '@readme/markdown';

export function convertToHTML(openapiInput: OpenAPI.Document): string {
  // lol. lmao, even.
  const doc = new Oas(JSON.parse(JSON.stringify(openapiInput)));

  const desc = doc.getPaths()['/api/ping'].get.getDescription();

  return html(desc);
}
