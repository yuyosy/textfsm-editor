import { textFsmEngine } from './engine';
import {
  createFailedResultItem,
  createNotificationForResultItem,
  createSuccessfulResultItem,
} from './parsePresentation';
import { TextFsmEngineError } from './types';

import type { NotificationItemInfo, ResultItem } from '@/types';
import type {
  TextFsmEngine,
  TextFsmParseInput,
  TextFsmParseOptions,
} from './types';

export interface ParseRunnerResult {
  response: ResultItem | null;
  notification: NotificationItemInfo | null;
}

type ActiveRequest = {
  controller: AbortController;
  ownerId: string;
  requestId: number;
};

const EMPTY_RESULT: ParseRunnerResult = {
  notification: null,
  response: null,
};

export interface TextFsmParseRunner {
  abortOwner(ownerId: string): void;
  invalidateActive(): void;
  parse(
    ownerId: string,
    input: TextFsmParseInput,
    onInitializationChange?: TextFsmParseOptions['onInitializationChange'],
  ): Promise<ParseRunnerResult>;
}

export const createTextFsmParseRunner = (
  engine: TextFsmEngine,
): TextFsmParseRunner => {
  let active: ActiveRequest | undefined;
  let nextRequestId = 0;

  const isActiveRequest = (requestId: number): boolean =>
    active?.requestId === requestId;

  const abortActive = (): void => {
    const current = active;
    active = undefined;
    current?.controller.abort();
  };

  return {
    abortOwner(ownerId) {
      if (active?.ownerId !== ownerId) {
        return;
      }

      abortActive();
    },
    invalidateActive() {
      abortActive();
    },
    async parse(ownerId, input, onInitializationChange) {
      abortActive();

      const controller = new AbortController();
      const requestId = ++nextRequestId;
      active = {
        controller,
        ownerId,
        requestId,
      };

      try {
        const result = await engine.parse(input, {
          onInitializationChange,
          signal: controller.signal,
        });
        if (!isActiveRequest(requestId)) {
          return EMPTY_RESULT;
        }

        active = undefined;
        const response = createSuccessfulResultItem(result);
        return {
          notification: createNotificationForResultItem(response),
          response,
        };
      } catch (error) {
        if (!isActiveRequest(requestId)) {
          return EMPTY_RESULT;
        }

        active = undefined;
        const response = createFailedResultItem(error);
        const reportedInitializationFailure =
          onInitializationChange !== undefined &&
          error instanceof TextFsmEngineError &&
          error.code === 'PYODIDE_INIT';
        return {
          notification: reportedInitializationFailure
            ? null
            : createNotificationForResultItem(response),
          response,
        };
      }
    },
  };
};

export const textFsmParseRunner = createTextFsmParseRunner(textFsmEngine);
