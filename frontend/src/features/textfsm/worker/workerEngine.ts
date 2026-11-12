import { TEXTFSM_LIMITS, validateParseInput } from '../limits';
import { TextFsmEngineError, TextFsmParseError } from '../types';

import type {
  TextFsmEngine,
  TextFsmParseOptions,
  TextFsmParseResult,
} from '../types';
import type { WorkerFactory, WorkerLike, WorkerResponse } from './protocol';

type ActiveRequest = {
  abortListener: (() => void) | undefined;
  id: string;
  initializing: boolean;
  onInitializationChange: TextFsmParseOptions['onInitializationChange'];
  reject: (reason: Error) => void;
  resolve: (result: TextFsmParseResult) => void;
  signal: AbortSignal | undefined;
  timeout: ReturnType<typeof setTimeout> | undefined;
  parseTimeoutMs: number;
};

const ABORTED_MESSAGE = 'TextFSM parsing was aborted.';
const WORKER_ERROR_MESSAGE =
  'The TextFSM worker encountered an unexpected error.';

export const createWorkerTextFsmEngine = (
  workerFactory: WorkerFactory,
  { initializationTimeoutMs }: { initializationTimeoutMs?: number } = {},
): TextFsmEngine => {
  let active: ActiveRequest | undefined;
  let disposed = false;
  let worker: WorkerLike | undefined;
  let workerReady = false;

  const clearRequestResources = (request: ActiveRequest): void => {
    clearTimeout(request.timeout);
    if (request.signal !== undefined && request.abortListener !== undefined) {
      request.signal.removeEventListener('abort', request.abortListener);
    }
  };

  const settle = (
    request: ActiveRequest,
    outcome: { result: TextFsmParseResult } | { error: Error },
    shouldRetireWorker: boolean,
  ): void => {
    if (active !== request) {
      return;
    }

    active = undefined;
    clearRequestResources(request);

    if (request.initializing && 'error' in outcome) {
      const interrupted =
        outcome.error instanceof TextFsmEngineError &&
        outcome.error.code === 'ABORTED';
      request.onInitializationChange?.(interrupted ? 'interrupted' : 'failed');
    }

    if ('result' in outcome) {
      request.resolve(outcome.result);
    } else {
      request.reject(outcome.error);
    }

    if (shouldRetireWorker) {
      retireWorker();
    }
  };

  const startParseTimer = (request: ActiveRequest): void => {
    clearTimeout(request.timeout);
    request.timeout = setTimeout(() => {
      settle(
        request,
        {
          error: new TextFsmEngineError(
            'TIMED_OUT',
            'TextFSM parsing timed out.',
          ),
        },
        true,
      );
    }, request.parseTimeoutMs);
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

    if (response.type === 'started') {
      if (request.initializing) {
        workerReady = true;
        request.initializing = false;
        request.onInitializationChange?.('ready');
      }
      startParseTimer(request);
      return;
    }
    if (response.type === 'loading-package') {
      if (request.initializing) request.onInitializationChange?.('package');
      return;
    }
    if (response.type === 'success') {
      settle(request, { result: response.result }, false);
      return;
    }

    settle(
      request,
      {
        error: response.error.reason
          ? new TextFsmParseError(response.error.reason, response.error.message)
          : new TextFsmEngineError(response.error.code, response.error.message),
      },
      response.error.code === 'PYODIDE_INIT',
    );
  };

  const handleError = (source: WorkerLike): void => {
    const request = active;
    if (source !== worker) {
      return;
    }

    if (request === undefined) {
      retireWorker();
      return;
    }

    settle(
      request,
      {
        error: new TextFsmEngineError(
          request.initializing ? 'PYODIDE_INIT' : 'WORKER_ERROR',
          WORKER_ERROR_MESSAGE,
        ),
      },
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
    workerReady = false;
    retiringWorker?.terminate();
  };

  const ensureWorker = (): WorkerLike | undefined => {
    if (worker === undefined) {
      worker = createWorker();
    }
    return worker;
  };

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

    const initializing = initializationTimeoutMs !== undefined && !workerReady;
    const activeWorker = ensureWorker();
    if (activeWorker === undefined) {
      if (initializing) options.onInitializationChange?.('failed');
      return Promise.reject(
        new TextFsmEngineError(
          initializing ? 'PYODIDE_INIT' : 'WORKER_ERROR',
          WORKER_ERROR_MESSAGE,
        ),
      );
    }

    return new Promise<TextFsmParseResult>((resolve, reject) => {
      const request: ActiveRequest = {
        abortListener: undefined,
        id: crypto.randomUUID(),
        initializing,
        onInitializationChange: options.onInitializationChange,
        reject,
        resolve,
        signal: options.signal,
        timeout: undefined,
        parseTimeoutMs: options.timeoutMs ?? TEXTFSM_LIMITS.timeoutMs,
      };
      if (!initializing) {
        startParseTimer(request);
      } else {
        request.timeout = setTimeout(() => {
          settle(
            request,
            {
              error: new TextFsmEngineError(
                'PYODIDE_INIT',
                'Pyodide initialization timed out.',
              ),
            },
            true,
          );
        }, initializationTimeoutMs);
      }

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
        if (initializing) request.onInitializationChange?.('runtime');
        activeWorker.postMessage({ id: request.id, input, type: 'parse' });
      } catch {
        settle(
          request,
          {
            error: new TextFsmEngineError(
              initializing ? 'PYODIDE_INIT' : 'WORKER_ERROR',
              WORKER_ERROR_MESSAGE,
            ),
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
      settle(
        active,
        { error: new TextFsmEngineError('ABORTED', ABORTED_MESSAGE) },
        false,
      );
    }
    retireWorker();
  };

  return { dispose, parse };
};
