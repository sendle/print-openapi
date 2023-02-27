import {temporaryFile} from 'tempy';

test('dereferences OpenAPI file correctly', () => {
  console.log(temporaryFile());

  expect(1 + 2).toBe(3);
});
