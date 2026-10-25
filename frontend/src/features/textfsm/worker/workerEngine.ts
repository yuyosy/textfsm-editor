import { TEXTFSM_LIMITS, validateParseInput } from '../limits';
import { TextFsmEngineError } from '../types';

import type {
  TextFsmEngine,
  TextFsmParseOptions,
  TextFsmParseResult,
} from '../types';
import type { WorkerFactory, WorkerLike, WorkerResponse } from './protocol';

type ActiveRequest = {
  abortListener: (() => void) | undefined;
  id: string;
  reject: (reason: TextFsmEngineError) => void;
  resolve: (result: TextFsmParseResult) => void;
  signal: AbortSignal | undefined;
  timeout: ReturnType<typeof setTimeout>;
};

const ABORTED_MESSAGE = 'TextFSM parsing was aborted.';
const WORKER_ERROR_MESSAGE =
  'The TextFSM worker encountered an unexpected error.';

export const createWorkerTextFsmEngine = (
  workerFactory: WorkerFactory,
): TextFsmEngine => {
  let active: ActiveRequest | undefined;
  let disposed = false;
  let worker: WorkerLike | undefined;

  const clearRequestResources = (request: ActiveRequest): void => {
    clearTimeout(request.timeout);
    if (request.signal !== undefined && request.abortListener !== undefined) {
      request.signal.removeEventListener('abort', request.abortListener);
    }
  };

  const settle = (
    request: ActiveRequest,
    outcome: { result: TextFsmParseResult } | { error: TextFsmEngineError },
    shouldReplaceWorker: boolean,
  ): void => {
    if (active !== request) {
      return;
    }

    active = undefined;
    clearRequestResources(request);

    if ('result' in outcome) {
      request.resolve(outcome.result);
    } else {
      request.reject(outcome.error);
    }

    if (shouldReplaceWorker) {
      replaceWorker();
    }
  };

  const handleMessage = (
    source: WorkerLike,
    response: WorkerResponse,
  ): void => {
    const request = active;
    if (
      source !== worker ||
      request === undefined ||
      response.id !== request.id
    ) {
      return;
    }

    if (response.type === 'success') {
      settle(request, { result: response.result }, false);
      return;
    }

    settle(
      request,
      {
        error: new TextFsmEngineError(
          response.error.code,
          response.error.message,
        ),
      },
      false,
    );
  };

  const handleError = (source: WorkerLike): void => {
    const request = active;
    if (source !== worker) {
      return;
    }

    if (request === undefined) {
      replaceWorker();
      return;
    }

    settle(
      request,
      { error: new TextFsmEngineError('WORKER_ERROR', WORKER_ERROR_MESSAGE) },
      true,
    );
  };

  const createWorker = (): WorkerLike | undefined => {
    try {
      const nextWorker = workerFactory();
      nextWorker.onmessage = (event) => {
        handleMessage(nextWorker, event.data);
      };
      nextWorker.onerror = () => {
        handleError(nextWorker);
      };
      return nextWorker;
    } catch {
      return undefined;
    }
  };

  const retireWorker = (): void => {
    const retiringWorker = worker;
    worker = undefined;
    retiringWorker?.terminate();
  };

  const replaceWorker = (): void => {
    retireWorker();
    if (!disposed) {
      worker = createWorker();
    }
  };

  const ensureWorker = (): WorkerLike | undefined => {
    if (worker === undefined) {
      worker = createWorker();
    }
    return worker;
  };

  worker = createWorker();

  const parse = (
    input: Parameters<TextFsmEngine['parse']>[0],
    options: TextFsmParseOptions = {},
  ): Promise<TextFsmParseResult> => {
    if (disposed) {
      return Promise.reject(
        new TextFsmEngineError(
          'WORKER_ERROR',
          'The TextFSM worker engine is disposed.',
        ),
      );
    }

    try {
      validateParseInput(input);
    } catch (error) {
      return Promise.reject(error);
    }

    if (active !== undefined) {
      settle(
        active,
        { error: new TextFsmEngineError('ABORTED', ABORTED_MESSAGE) },
        true,
      );
    }

    const activeWorker = ensureWorker();
    if (activeWorker === undefined) {
      return Promise.reject(
        new TextFsmEngineError('WORKER_ERROR', WORKER_ERROR_MESSAGE),
      );
    }

    return new Promise<TextFsmParseResult>((resolve, reject) => {
      const timeoutMs = options.timeoutMs ?? TEXTFSM_LIMITS.timeoutMs;
      const request: ActiveRequest = {
        abortListener: undefined,
        id: crypto.randomUUID(),
        reject,
        resolve,
        signal: options.signal,
        timeout: setTimeout(() => {
          settle(
            request,
            {
              error: new TextFsmEngineError(
                'TIMED_OUT',
                `TextFSM parsing timed out after ${timeoutMs}ms.`,
              ),
            },
            true,
          );
        }, timeoutMs),
      };

      request.abortListener = () => {
        settle(
          request,
          { error: new TextFsmEngineError('ABORTED', ABORTED_MESSAGE) },
          true,
        );
      };
      active = request;
      request.signal?.addEventListener('abort', request.abortListener, {
        once: true,
      });

      if (request.signal?.aborted) {
        request.abortListener();
        return;
      }

      try {
        activeWorker.postMessage({ id: request.id, input, type: 'parse' });
      } catch {
        settle(
          request,
          {
            error: new TextFsmEngineError('WORKER_ERROR', WORKER_ERROR_MESSAGE),
          },
          true,
        );
      }
    });
  };

  const dispose = (): void => {
    if (disposed) {
      return;
    }

    disposed = true;
    if (active !== undefined) {
      const request = active;
      active = undefined;
      clearRequestResources(request);
      request.reject(new TextFsmEngineError('ABORTED', ABORTED_MESSAGE));
    }
    retireWorker();
  };

  return { dispose, parse };
};
