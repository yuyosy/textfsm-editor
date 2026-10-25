import { TextFsmEngineError } from './types';

import type { TextFsmParseInput } from './types';

export const TEXTFSM_LIMITS = {
  maxColumns: 256,
  maxDataChars: 100_000,
  maxRecords: 10_000,
  maxResultBytes: 5 * 1024 * 1024,
  maxTemplateChars: 10_000,
  timeoutMs: 2_000,
} as const;

export function validateParseInput(input: TextFsmParseInput): void {
  if (input.templateString.length > TEXTFSM_LIMITS.maxTemplateChars) {
    throw new TextFsmEngineError(
      'TEMPLATE_TOO_LARGE',
      `Template exceeds the maximum allowed length of ${TEXTFSM_LIMITS.maxTemplateChars} characters.`,
    );
  }

  if (input.dataString.length > TEXTFSM_LIMITS.maxDataChars) {
    throw new TextFsmEngineError(
      'DATA_TOO_LARGE',
      `Data exceeds the maximum allowed length of ${TEXTFSM_LIMITS.maxDataChars} characters.`,
    );
  }
}
