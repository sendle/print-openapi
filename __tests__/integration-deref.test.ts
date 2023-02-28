import fs from 'fs';
import { join } from 'path';
import * as tmp from 'tmp';

import { expect, test } from '@jest/globals';

import { derefOAS } from '../src/lib/convertOAS';

test('dereferences OpenAPI file correctly', done => {
  // get tmp file
  const tmpobj = tmp.fileSync();

  derefOAS(join(__dirname, 'openapi-1.yaml'), tmpobj.name, ['system-messages'], () => {
    expect(JSON.parse(fs.readFileSync(tmpobj.name, 'utf8'))).toEqual(JSON.parse(fs.readFileSync(join(__dirname, 'openapi-1-dereferenced-sysmsg.json'), 'utf8')));

    tmpobj.removeCallback();

    done();
  });
});
