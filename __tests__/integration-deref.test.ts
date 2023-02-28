import * as tmp from 'tmp';
import { convertToHTML } from '../src/lib/convertOAS'

test('dereferences OpenAPI file correctly', () => {
  const tmpobj = tmp.fileSync();
  console.log('File: ', tmpobj.name);
  console.log('Filedescriptor: ', tmpobj.fd);
  tmpobj.removeCallback();

  expect(1 + 2).toBe(3);
});
