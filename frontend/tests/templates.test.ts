import { createHash, webcrypto } from 'node:crypto';

import { afterEach, expect, test, vi } from 'vitest';

import { parseNtcTemplateManifest } from '../src/features/templates/manifest';

const text = 'Value NAME (\\S+)\n\nStart\n  ^${NAME} -> Record\n';
const entry = {
  commandRaw: 'show',
  commandRegex: 'show',
  hostname: '.*',
  path: 'templates/sample.textfsm',
  platform: 'sample',
  template: 'sample.textfsm',
  sha256: createHash('sha256').update(text).digest('hex'),
};
const manifest = (version: string) => ({
  schemaVersion: 1,
  version,
  generatedAt: '2026-10-25',
  entries: [entry],
});

afterEach(() => vi.unstubAllGlobals());

test('accepts template releases without a version pinned in application code', () => {
  expect(parseNtcTemplateManifest(manifest('10.0.0')).version).toBe('10.0.0');
  expect(() => parseNtcTemplateManifest(manifest('../10.0.0'))).toThrow(
    /version/,
  );
});

test('loads direct public paths under the application base and revalidates caches', async () => {
  vi.stubGlobal('document', { baseURI: 'https://example.com/editor/' });
  const { createStaticTemplateRepository } = await import(
    '../src/features/templates/staticTemplateRepository'
  );
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(async (url) =>
      String(url).endsWith('manifest.json')
        ? Response.json(manifest('10.0.0'))
        : new Response(text),
    );
  const repository = createStaticTemplateRepository({
    baseUrl: '/editor/',
    documentBaseURI: 'https://example.com/editor/',
    fetch,
    crypto: webcrypto as unknown as Crypto,
  });
  const [template] = await repository.list();
  expect(await repository.load(template)).toBe(text);
  expect(fetch).toHaveBeenNthCalledWith(
    1,
    'https://example.com/editor/ntc-templates/manifest.json',
    { cache: 'no-cache' },
  );
  expect(fetch).toHaveBeenNthCalledWith(
    2,
    'https://example.com/editor/ntc-templates/templates/sample.textfsm',
    { cache: 'no-cache' },
  );
  await repository.load(template);
  expect(fetch).toHaveBeenCalledTimes(2);
});
