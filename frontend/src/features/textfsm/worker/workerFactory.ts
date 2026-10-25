import TextFsmWorker from './textfsm.worker?worker';

import type { WorkerLike } from './protocol';

export const createTextFsmWorker = (): WorkerLike => new TextFsmWorker();
