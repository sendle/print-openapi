import * as tmp from 'tmp';
import fs from 'fs';
import { join } from 'path';

import { derefOAS } from '../src/lib/convertOAS'

test('dereferences OpenAPI file correctly', done => {
  // get tmp file
  const tmpobj = tmp.fileSync();

  derefOAS(join(__dirname, 'openapi-1.yaml'), tmpobj.name, ['system-messages'], () => {
    expect(fs.readFileSync(tmpobj.name)).toEqual(fs.readFileSync(join(__dirname, 'openapi-1-dereferenced-sysmsg.json')));

    tmpobj.removeCallback();

    done();
  });
});
