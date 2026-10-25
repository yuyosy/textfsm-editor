import { afterEach, expect, test, vi } from 'vitest';

import { createBackendTextFsmEngine } from '../src/features/textfsm/backendEngine';
import { TEXTFSM_LIMITS } from '../src/features/textfsm/limits';
import { createTextFsmParseRunner } from '../src/features/textfsm/parseRunner';

const input = {
  templateString: 'Value NAME (\\S+)\n\nStart\n  ^${NAME} -> Record\n',
  dataString: 'hello',
};
const success = {
  ok: true,
  data: {
    header: ['NAME'],
    results: [{ NAME: 'hello' }, { NAME: ['a', 'b'] }],
  },
};

afterEach(() => vi.useRealTimers());

test('posts the existing Python API contract to the configured backend', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(Response.json(success));
  const engine = createBackendTextFsmEngine({
    apiBaseUrl: 'http://localhost:8000/',
    fetch,
  });
  expect(await engine.parse(input)).toEqual({
    header: ['NAME'],
    records: success.data.results,
  });
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:8000/api/parse',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          template_string: input.templateString,
          data_string: input.dataString,
        },
      }),
      signal: expect.any(AbortSignal),
    }),
  );
});

test('preserves Python template error details in the shared result presentation', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    Response.json({
      ok: false,
      errors: [
        {
          status: 'ParseError',
          reason: 'TextFSMTemplateError',
          message: 'Invalid state at line 4.',
        },
      ],
    }),
  );
  const runner = createTextFsmParseRunner(
    createBackendTextFsmEngine({ fetch }),
  );
  const result = await runner.parse('test', input);
  expect(result.response?.ok).toBe(false);
  expect(result.notification).toMatchObject({
    type: 'error',
    title: 'TextFSMTemplateError',
    message: 'Invalid state at line 4.',
  });
});

test('reports HTTP and connection failures without falling back to another parser', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(
      Response.json({ detail: 'Payload too large' }, { status: 413 }),
    )
    .mockRejectedValueOnce(new TypeError('Failed to fetch'));
  const engine = createBackendTextFsmEngine({ fetch });
  await expect(engine.parse(input)).rejects.toMatchObject({
    reason: 'Backend request failed (HTTP 413)',
    message: 'Payload too large',
  });
  await expect(engine.parse(input)).rejects.toMatchObject({
    reason: 'Backend unavailable',
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('rejects invalid, oversized, or excessive results and validates inputs before sending', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(
      Response.json({
        ok: true,
        data: { header: ['NAME'], results: [{ NAME: 123 }] },
      }),
    )
    .mockResolvedValueOnce(new Response('not JSON'))
    .mockResolvedValueOnce(
      Response.json({
        ok: true,
        data: {
          header: ['NAME'],
          results: Array(TEXTFSM_LIMITS.maxRecords + 1).fill({ NAME: '' }),
        },
      }),
    )
    .mockResolvedValueOnce(
      new Response('x'.repeat(TEXTFSM_LIMITS.maxResultBytes + 1)),
    );
  const engine = createBackendTextFsmEngine({ fetch });
  for (const code of [
    'INVALID_RESULT',
    'INVALID_RESULT',
    'TOO_MANY_RECORDS',
    'RESULT_TOO_LARGE',
  ]) {
    await expect(engine.parse(input)).rejects.toMatchObject({ code });
  }
  await expect(
    engine.parse({
      ...input,
      dataString: 'x'.repeat(TEXTFSM_LIMITS.maxDataChars + 1),
    }),
  ).rejects.toMatchObject({ code: 'DATA_TOO_LARGE' });
  expect(fetch).toHaveBeenCalledTimes(4);
});

function hangingFetch() {
  return vi.fn<typeof globalThis.fetch>().mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      }),
  );
}

test('propagates cancellation to fetch and suppresses responses cancelled during a mode change', async () => {
  const fetch = hangingFetch();
  const runner = createTextFsmParseRunner(
    createBackendTextFsmEngine({ fetch }),
  );
  const pending = runner.parse('backend', input);
  runner.invalidateActive();
  await expect(pending).resolves.toEqual({
    response: null,
    notification: null,
  });
  expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

test('enforces timeout and disposes pending HTTP requests', async () => {
  vi.useFakeTimers();
  const fetch = hangingFetch();
  const engine = createBackendTextFsmEngine({ fetch });
  const timeout = expect(
    engine.parse(input, { timeoutMs: 50 }),
  ).rejects.toMatchObject({ code: 'TIMED_OUT' });
  await vi.advanceTimersByTimeAsync(50);
  await timeout;
  const pending = expect(engine.parse(input)).rejects.toMatchObject({
    code: 'ABORTED',
  });
  engine.dispose();
  await pending;
  await expect(engine.parse(input)).rejects.toMatchObject({ code: 'ABORTED' });
});
