import { createWorkerTextFsmEngine } from './worker/workerEngine';
import { createTextFsmWorker } from './worker/workerFactory';

export const textFsmEngine = createWorkerTextFsmEngine(createTextFsmWorker);
