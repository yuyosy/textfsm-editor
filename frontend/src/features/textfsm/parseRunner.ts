import { textFsmEngine } from './engine';
import {
  createFailedResultItem,
  createNotificationForResultItem,
  createSuccessfulResultItem,
} from './parsePresentation';

import type { NotificationItemInfo, ResultItem } from '@/types';
import type { TextFsmEngine, TextFsmParseInput } from './types';

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
  parse(ownerId: string, input: TextFsmParseInput): Promise<ParseRunnerResult>;
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
    async parse(ownerId, input) {
      abortActive();

      const controller = new AbortController();
      const requestId = ++nextRequestId;
      active = {
        controller,
        ownerId,
        requestId,
      };

      try {
        const result = await engine.parse(input, { signal: controller.signal });
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
        return {
          notification: createNotificationForResultItem(response),
          response,
        };
      }
    },
  };
};

export const textFsmParseRunner = createTextFsmParseRunner(textFsmEngine);
