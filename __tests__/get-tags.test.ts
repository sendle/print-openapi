import { join } from 'path';

import { expect, test } from '@jest/globals';

import { getOASTags, Tag } from '../src/lib/convertOAS';

test('gets OpenAPI tags', done => {
  getOASTags(join(__dirname, 'openapi-1.yaml'), tags => {
    try {
      expect(tags).toEqual([
        {
          Tag: "moderation",
          Description: "API used by moderators and admins.",
        },
        {
          Tag: "system-messages",
          Description: "Post system messages.",
        },
      ]);
      done();
    } catch (error) {
      if (error instanceof Error || typeof error === 'string') {
        done(error);
      } else {
        // convert it first to stop typescript from yelling
        done(String(error));
      }
    }
  });
});
