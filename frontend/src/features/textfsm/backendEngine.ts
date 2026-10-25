import { TEXTFSM_LIMITS, validateParseInput } from './limits';
import { TextFsmEngineError } from './types';

import type { TextFsmEngine, TextFsmParseResult, TextFsmRecord } from './types';

export class TextFsmBackendError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = 'TextFsmBackendError';
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseBackendResponse(value: unknown): TextFsmParseResult {
  if (!isObject(value) || typeof value.ok !== 'boolean') {
    throw new TextFsmEngineError('INVALID_RESULT', 'Invalid backend response.');
  }
  if (!value.ok) {
    const error = Array.isArray(value.errors) ? value.errors[0] : undefined;
    if (
      isObject(error) &&
      typeof error.reason === 'string' &&
      typeof error.message === 'string'
    ) {
      throw new TextFsmBackendError(error.reason, error.message);
    }
    throw new TextFsmEngineError(
      'INVALID_RESULT',
      'Missing backend parse error.',
    );
  }
  const data = value.data;
  if (
    !isObject(data) ||
    !Array.isArray(data.header) ||
    !data.header.every((field) => typeof field === 'string') ||
    !Array.isArray(data.results)
  ) {
    throw new TextFsmEngineError('INVALID_RESULT', 'Invalid backend result.');
  }
  if (data.header.length > TEXTFSM_LIMITS.maxColumns)
    throw new TextFsmEngineError('TOO_MANY_COLUMNS', 'Too many columns.');
  if (data.results.length > TEXTFSM_LIMITS.maxRecords)
    throw new TextFsmEngineError('TOO_MANY_RECORDS', 'Too many records.');
  for (const record of data.results) {
    if (
      !isObject(record) ||
      !Object.values(record).every(
        (cell) =>
          typeof cell === 'string' ||
          (Array.isArray(cell) &&
            cell.every((item) => typeof item === 'string')),
      )
    ) {
      throw new TextFsmEngineError('INVALID_RESULT', 'Invalid backend record.');
    }
  }
  return { header: data.header, records: data.results as TextFsmRecord[] };
}

async function readResponse(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader)
    throw new TextFsmEngineError('INVALID_RESULT', 'Empty backend response.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > TEXTFSM_LIMITS.maxResultBytes) {
        await reader.cancel();
        throw new TextFsmEngineError(
          'RESULT_TOO_LARGE',
          'Backend response is too large.',
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new TextFsmEngineError(
      'INVALID_RESULT',
      'Backend did not return valid JSON.',
    );
  }
}

export function createBackendTextFsmEngine({
  apiBaseUrl = '',
  fetch: fetchImpl = globalThis.fetch,
}: {
  apiBaseUrl?: string;
  fetch?: typeof fetch;
} = {}): TextFsmEngine {
  const controllers = new Set<AbortController>();
  let disposed = false;
  return {
    async parse(input, options = {}) {
      validateParseInput(input);
      if (disposed || options.signal?.aborted)
        throw new TextFsmEngineError('ABORTED', 'Parsing cancelled.');
      const controller = new AbortController();
      controllers.add(controller);
      let timedOut = false;
      const abort = () => controller.abort();
      options.signal?.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, options.timeoutMs ?? 10_000);
      try {
        const response = await fetchImpl(
          `${apiBaseUrl.replace(/\/+$/u, '')}/api/parse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                template_string: input.templateString,
                data_string: input.dataString,
              },
            }),
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          let message = `Backend returned HTTP ${response.status}.`;
          try {
            const body = await readResponse(response);
            if (isObject(body) && typeof body.detail === 'string')
              message = body.detail;
          } catch (error) {
            if (controller.signal.aborted) throw error;
          }
          throw new TextFsmBackendError(
            `Backend request failed (HTTP ${response.status})`,
            message,
          );
        }
        const body = await readResponse(response);
        controller.signal.throwIfAborted();
        return parseBackendResponse(body);
      } catch (error) {
        if (controller.signal.aborted)
          throw new TextFsmEngineError(
            timedOut ? 'TIMED_OUT' : 'ABORTED',
            'Backend request stopped.',
          );
        if (
          error instanceof TextFsmBackendError ||
          error instanceof TextFsmEngineError
        )
          throw error;
        throw new TextFsmBackendError(
          'Backend unavailable',
          'Could not reach the TextFSM backend. Check the server and API URL.',
        );
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
        controllers.delete(controller);
      }
    },
    dispose() {
      disposed = true;
      for (const controller of controllers) controller.abort();
      controllers.clear();
    },
  };
}
