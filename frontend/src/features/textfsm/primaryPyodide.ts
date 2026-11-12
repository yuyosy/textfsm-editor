import PyodideWorker from './worker/pyodide.worker?worker';
import { createWorkerTextFsmEngine } from './worker/workerEngine';

import type { TextFsmParserMode } from './types';

export const primaryMode: Exclude<TextFsmParserMode, 'local'> = 'pyodide';
export const createPrimaryEngine = () =>
  createWorkerTextFsmEngine(() => new PyodideWorker(), {
    initializationTimeoutMs: 60_000,
  });
