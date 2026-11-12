import type {
  TextFsmErrorCode,
  TextFsmParseInput,
  TextFsmParseResult,
} from '../types';

export type WorkerOperation =
  | { type: 'parse'; input: TextFsmParseInput }
  | { type: 'initialize' };

export type WorkerRequest = WorkerOperation & { id: string };

export type WorkerResponse =
  | { id: string; type: 'started' }
  | { id: string; type: 'initialized' }
  | { id: string; type: 'loading-package' }
  | { id: string; type: 'success'; result: TextFsmParseResult }
  | {
      id: string;
      type: 'failure';
      error: { code: TextFsmErrorCode; message: string; reason?: string };
    };

export interface WorkerLike {
  onerror: ((event: ErrorEvent) => void) | null;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

export type WorkerFactory = () => WorkerLike;
