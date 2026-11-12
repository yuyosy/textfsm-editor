import { afterEach, expect, test, vi } from 'vitest';

import { createWorkerTextFsmEngine } from '../src/features/textfsm/worker/workerEngine';

import type {
  WorkerLike,
  WorkerRequest,
} from '../src/features/textfsm/worker/protocol';

const input = { templateString: 'template', dataString: 'input' };

function createWorker() {
  const postMessage = vi.fn<(request: WorkerRequest) => void>();
  const terminate = vi.fn();
  const worker: WorkerLike = {
    onerror: null,
    onmessage: null,
    postMessage,
    terminate,
  };
  return { worker, postMessage, terminate };
}

afterEach(() => vi.useRealTimers());

test('preloads without parsing and reuses the same worker for a queued parse', async () => {
  const { worker, postMessage, terminate } = createWorker();
  const factory = vi.fn(() => worker);
  const engine = createWorkerTextFsmEngine(factory, {
    initializationTimeoutMs: 60_000,
  });
  const loading = engine.preload?.();
  const result = engine.parse(input);
  expect(postMessage).toHaveBeenCalledOnce();
  const initialize = postMessage.mock.calls[0][0];
  expect(initialize).toEqual({ type: 'initialize', id: initialize.id });

  worker.onmessage?.(
    new MessageEvent('message', {
      data: { id: initialize.id, type: 'initialized' },
    }),
  );
  await loading;
  const request = postMessage.mock.calls[1][0];
  expect(request).toEqual({ type: 'parse', id: request.id, input });
  expect(factory).toHaveBeenCalledOnce();
  expect(terminate).not.toHaveBeenCalled();

  const data = { header: ['FIELD'], records: [] };
  worker.onmessage?.(
    new MessageEvent('message', {
      data: { id: request.id, type: 'success', result: data },
    }),
  );
  await expect(result).resolves.toEqual(data);
  engine.dispose();
});

test('cancelling a preload stops a parse that was waiting for it', async () => {
  const { worker, postMessage, terminate } = createWorker();
  const engine = createWorkerTextFsmEngine(() => worker, {
    initializationTimeoutMs: 60_000,
  });
  const controller = new AbortController();
  const loading = engine.preload?.({ signal: controller.signal });
  const result = engine.parse(input);

  controller.abort();

  await expect(loading).rejects.toMatchObject({ code: 'ABORTED' });
  await expect(result).rejects.toMatchObject({ code: 'ABORTED' });
  expect(postMessage).toHaveBeenCalledOnce();
  expect(terminate).toHaveBeenCalledOnce();
});

test('starts the parsing timeout after Pyodide initializes', async () => {
  vi.useFakeTimers();
  const { worker, postMessage, terminate } = createWorker();
  const engine = createWorkerTextFsmEngine(() => worker, {
    initializationTimeoutMs: 60_000,
  });
  const onInitializationChange = vi.fn();
  const result = engine.parse(input, {
    timeoutMs: 2_000,
    onInitializationChange,
  });
  const rejection = expect(result).rejects.toMatchObject({ code: 'TIMED_OUT' });
  const id = postMessage.mock.calls[0][0].id;

  await vi.advanceTimersByTimeAsync(10_000);
  expect(terminate).not.toHaveBeenCalled();
  worker.onmessage?.(
    new MessageEvent('message', { data: { id, type: 'loading-package' } }),
  );
  worker.onmessage?.(
    new MessageEvent('message', { data: { id, type: 'started' } }),
  );
  await vi.advanceTimersByTimeAsync(2_000);

  await rejection;
  expect(terminate).toHaveBeenCalledOnce();
  expect(onInitializationChange.mock.calls.flat()).toEqual([
    'runtime',
    'package',
    'ready',
  ]);
});

test('terminates a loading worker on cancellation and ignores its late progress', async () => {
  const { worker, postMessage, terminate } = createWorker();
  const engine = createWorkerTextFsmEngine(() => worker, {
    initializationTimeoutMs: 60_000,
  });
  const controller = new AbortController();
  const onInitializationChange = vi.fn();
  const result = engine.parse(input, {
    signal: controller.signal,
    onInitializationChange,
  });
  const id = postMessage.mock.calls[0][0].id;

  controller.abort();
  worker.onmessage?.(
    new MessageEvent('message', { data: { id, type: 'loading-package' } }),
  );

  await expect(result).rejects.toMatchObject({ code: 'ABORTED' });
  expect(terminate).toHaveBeenCalledOnce();
  expect(onInitializationChange.mock.calls.flat()).toEqual([
    'runtime',
    'interrupted',
  ]);
});

test('retries with a fresh worker after Pyodide initialization times out', async () => {
  vi.useFakeTimers();
  const firstWorker = createWorker();
  const secondWorker = createWorker();
  const factory = vi
    .fn()
    .mockReturnValueOnce(firstWorker.worker)
    .mockReturnValueOnce(secondWorker.worker);
  const engine = createWorkerTextFsmEngine(factory, {
    initializationTimeoutMs: 60_000,
  });

  const firstResult = expect(engine.parse(input)).rejects.toMatchObject({
    code: 'PYODIDE_INIT',
  });
  await vi.advanceTimersByTimeAsync(60_000);
  await firstResult;
  expect(firstWorker.terminate).toHaveBeenCalledOnce();
  expect(factory).toHaveBeenCalledOnce();

  const result = engine.parse(input);
  const id = secondWorker.postMessage.mock.calls[0][0].id;
  const data = { header: ['FIELD'], records: [] };
  secondWorker.worker.onmessage?.(
    new MessageEvent('message', {
      data: { id, type: 'success', result: data },
    }),
  );
  await expect(result).resolves.toEqual(data);
  engine.dispose();
});
