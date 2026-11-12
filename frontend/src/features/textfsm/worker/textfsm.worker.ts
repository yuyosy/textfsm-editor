import { handleTextFsmWorkerRequest } from './handleRequest';

import type { WorkerRequest } from './protocol';

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  if (event.data.type === 'parse') {
    self.postMessage(handleTextFsmWorkerRequest(event.data));
  }
};
