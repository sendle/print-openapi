import fs from 'fs';
import { join } from 'path';
import * as tmp from 'tmp';

import { expect, test } from '@jest/globals';

import { loadOASToHTML } from '../src/lib/convertOAS';

test('generates valid HTML file', done => {
  // get tmp file
  const tmpobj = tmp.fileSync();

  loadOASToHTML(join(__dirname, 'openapi-1.yaml'), tmpobj.name, [], async () => {
    const validator = require('html-validator')
    const options = {
      validator: 'WHATWG',
      data: fs.readFileSync(tmpobj.name, 'utf8'),
      isFragment: false
    }

    tmpobj.removeCallback();

    try {
      const result = await validator(options);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.isValid).toBeTruthy();

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
