import { parseWithPackage } from '../adapter/packageAdapter';
import { validateParseInput } from '../limits';
import { TextFsmEngineError } from '../types';

import type { WorkerRequest, WorkerResponse } from './protocol';

const PACKAGE_ERROR_MESSAGE = 'The TextFSM package could not parse the input.';

export const handleTextFsmWorkerRequest = (
  request: WorkerRequest,
): WorkerResponse => {
  try {
    validateParseInput(request.input);
    const result = parseWithPackage(
      request.input.templateString,
      request.input.dataString,
    );

    return { id: request.id, result, type: 'success' };
  } catch (error) {
    if (error instanceof TextFsmEngineError) {
      return {
        error: error.toJSON(),
        id: request.id,
        type: 'failure',
      };
    }

    return {
      error: { code: 'PACKAGE_ERROR', message: PACKAGE_ERROR_MESSAGE },
      id: request.id,
      type: 'failure',
    };
  }
};
