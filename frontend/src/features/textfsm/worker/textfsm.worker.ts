import { handleTextFsmWorkerRequest } from './handleRequest';

import type { WorkerRequest } from './protocol';

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  self.postMessage(handleTextFsmWorkerRequest(event.data));
};
