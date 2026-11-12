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

test('starts the parsing timeout after Pyodide initializes', async () => {
  vi.useFakeTimers();
  const { worker, postMessage, terminate } = createWorker();
  const engine = createWorkerTextFsmEngine(() => worker, {
    initializationTimeoutMs: 60_000,
  });
  const result = engine.parse(input, { timeoutMs: 2_000 });
  const rejection = expect(result).rejects.toMatchObject({ code: 'TIMED_OUT' });
  const id = postMessage.mock.calls[0][0].id;

  await vi.advanceTimersByTimeAsync(10_000);
  expect(terminate).not.toHaveBeenCalled();
  worker.onmessage?.(
    new MessageEvent('message', { data: { id, type: 'started' } }),
  );
  await vi.advanceTimersByTimeAsync(2_000);

  await rejection;
  expect(terminate).toHaveBeenCalledOnce();
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
