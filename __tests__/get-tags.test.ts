import { join } from 'path';

import { expect, test } from '@jest/globals';

import { getOASTags } from '../src/lib/convertOAS';

test('gets OpenAPI tags', () => {
  expect(getOASTags(join(__dirname, 'openapi-1.yaml'))).resolves.toEqual([
    {
      Tag: "moderation",
      Description: "API used by moderators and admins.",
    },
    {
      Tag: "system-messages",
      Description: "Post system messages.",
    },
  ]);
});
