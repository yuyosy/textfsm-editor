import type {
  TextFsmErrorCode,
  TextFsmParseInput,
  TextFsmParseResult,
} from '../types';

export type WorkerRequest = {
  id: string;
  type: 'parse';
  input: TextFsmParseInput;
};

export type WorkerResponse =
  | { id: string; type: 'success'; result: TextFsmParseResult }
  | {
      id: string;
      type: 'failure';
      error: { code: TextFsmErrorCode; message: string };
    };

export interface WorkerLike {
  onerror: ((event: ErrorEvent) => void) | null;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

export type WorkerFactory = () => WorkerLike;
