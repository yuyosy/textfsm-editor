import type { NotificationItemInfo, ResultError, ResultItem } from '@/types';
import type { TextFsmErrorCode, TextFsmParseResult } from './types';

const SUCCESS_MESSAGE = 'Parse completed.';

const ERROR_MESSAGES: Record<
  TextFsmErrorCode,
  { message: string; reason: string }
> = {
  ABORTED: {
    message: 'Parsing was cancelled.',
    reason: 'Parse cancelled',
  },
  DATA_TOO_LARGE: {
    message: 'The input data is too large to parse.',
    reason: 'Input too large',
  },
  INVALID_RESULT: {
    message: 'The parser returned an invalid result.',
    reason: 'Invalid result',
  },
  PACKAGE_ERROR: {
    message: 'The template could not be parsed.',
    reason: 'Template parse failed',
  },
  RESULT_TOO_LARGE: {
    message: 'The parse result is too large to display.',
    reason: 'Result too large',
  },
  TEMPLATE_TOO_LARGE: {
    message: 'The template is too large to parse.',
    reason: 'Template too large',
  },
  TIMED_OUT: {
    message: 'Parsing took too long and was stopped.',
    reason: 'Parse timed out',
  },
  TOO_MANY_COLUMNS: {
    message: 'The parse result has too many columns to display.',
    reason: 'Too many columns',
  },
  TOO_MANY_RECORDS: {
    message: 'The parse result has too many records to display.',
    reason: 'Too many records',
  },
  WORKER_ERROR: {
    message: 'The local parser encountered an unexpected problem.',
    reason: 'Parser unavailable',
  },
};

const FALLBACK_ERROR = {
  message: 'The parser could not complete the request.',
  reason: 'Unexpected parse failure',
};

type EngineLikeError = {
  code?: TextFsmErrorCode;
  name?: string;
};

const getTimestamp = (): string => new Date().toLocaleString();

const createResultError = (error: unknown): ResultError => {
  const engineError =
    typeof error === 'object' && error !== null
      ? (error as EngineLikeError)
      : {};
  const normalized =
    engineError.code !== undefined
      ? ERROR_MESSAGES[engineError.code]
      : undefined;

  return {
    status: '',
    reason: normalized?.reason ?? FALLBACK_ERROR.reason,
    message: normalized?.message ?? FALLBACK_ERROR.message,
  };
};

export const createSuccessfulResultItem = (
  result: TextFsmParseResult,
): ResultItem => ({
  code: 0,
  data: {
    header: result.header,
    message: SUCCESS_MESSAGE,
    results: result.records,
  },
  errors: undefined,
  ok: true,
  status: '',
  timestamp: getTimestamp(),
});

export const createFailedResultItem = (error: unknown): ResultItem => ({
  code: 0,
  data: undefined,
  errors: [createResultError(error)],
  ok: false,
  status: '',
  timestamp: getTimestamp(),
});

export const createNotificationForResultItem = (
  result: ResultItem,
): NotificationItemInfo | null => {
  if (result.ok && result.data !== undefined) {
    const recordCount = result.data.results.length;
    const message =
      recordCount === 0
        ? 'There are no records.'
        : recordCount === 1
          ? 'There is 1 record.'
          : `There are ${recordCount} records.`;

    return {
      type: 'api',
      title: result.data.message,
      message,
      metadata: {
        recordCount,
        results: result.data.results,
      },
    };
  }

  if (!result.ok && result.errors !== undefined && result.errors.length > 0) {
    return {
      type: 'error',
      title: result.errors[0].reason,
      message: result.errors[0].message,
      metadata: {
        errors: result.errors,
      },
    };
  }

  return null;
};
