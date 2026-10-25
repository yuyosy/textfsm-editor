import { TxtFSM } from 'txtfsm';

import { TEXTFSM_LIMITS } from '../limits';
import { TextFsmEngineError } from '../types';

import type {
  TextFsmCellValue,
  TextFsmParseResult,
  TextFsmRecord,
} from '../types';

const INVALID_RESULT_MESSAGE =
  'The TextFSM package returned an invalid result.';

const invalidResult = (): TextFsmEngineError =>
  new TextFsmEngineError('INVALID_RESULT', INVALID_RESULT_MESSAGE);

const hasDenseOwnIndex = (
  values: readonly unknown[],
  index: number,
): boolean => {
  return (
    index in values &&
    Reflect.getOwnPropertyDescriptor(values, String(index)) !== undefined
  );
};

const copyStringArray = (rawValue: unknown): string[] => {
  let length: number;

  try {
    if (!Array.isArray(rawValue)) {
      throw invalidResult();
    }
    length = rawValue.length;
  } catch {
    throw invalidResult();
  }

  try {
    const values = new Array<string>(length);
    for (let index = 0; index < length; index += 1) {
      if (!hasDenseOwnIndex(rawValue, index)) {
        throw invalidResult();
      }

      const value: unknown = rawValue[index];
      if (typeof value !== 'string') {
        throw invalidResult();
      }
      values[index] = value;
    }
    return values;
  } catch {
    throw invalidResult();
  }
};

const copyCellValue = (rawValue: unknown): TextFsmCellValue => {
  if (typeof rawValue === 'string') {
    return rawValue;
  }

  if (Array.isArray(rawValue)) {
    return copyStringArray(rawValue);
  }

  throw invalidResult();
};

const copyHeader = (parser: { readonly header: unknown }): string[] => {
  let rawHeader: unknown;
  let length: number;

  try {
    rawHeader = parser.header;
    if (!Array.isArray(rawHeader)) {
      throw invalidResult();
    }
    length = rawHeader.length;
  } catch {
    throw invalidResult();
  }

  if (length > TEXTFSM_LIMITS.maxColumns) {
    throw new TextFsmEngineError(
      'TOO_MANY_COLUMNS',
      `TextFSM result exceeds the maximum allowed column count of ${TEXTFSM_LIMITS.maxColumns}.`,
    );
  }

  try {
    const header = new Array<string>(length);
    for (let index = 0; index < length; index += 1) {
      if (
        !(index in rawHeader) ||
        Reflect.getOwnPropertyDescriptor(rawHeader, String(index)) === undefined
      ) {
        throw invalidResult();
      }

      const value: unknown = rawHeader[index];
      if (typeof value !== 'string') {
        throw invalidResult();
      }
      header[index] = value;
    }
    return header;
  } catch {
    throw invalidResult();
  }
};

const copyRecords = (rawRecords: unknown): TextFsmRecord[] => {
  let length: number;

  try {
    if (!Array.isArray(rawRecords)) {
      throw invalidResult();
    }
    length = rawRecords.length;
  } catch {
    throw invalidResult();
  }

  if (length > TEXTFSM_LIMITS.maxRecords) {
    throw new TextFsmEngineError(
      'TOO_MANY_RECORDS',
      `TextFSM result exceeds the maximum allowed record count of ${TEXTFSM_LIMITS.maxRecords}.`,
    );
  }

  try {
    const records = new Array<TextFsmRecord>(length);
    for (let index = 0; index < length; index += 1) {
      if (!hasDenseOwnIndex(rawRecords, index)) {
        throw invalidResult();
      }

      const rawRecord: unknown = rawRecords[index];
      if (
        rawRecord === null ||
        typeof rawRecord !== 'object' ||
        Array.isArray(rawRecord)
      ) {
        throw invalidResult();
      }

      const keys = Reflect.ownKeys(rawRecord);
      const record: TextFsmRecord = {};
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const key = keys[keyIndex];
        if (typeof key !== 'string') {
          throw invalidResult();
        }

        const value = copyCellValue(Reflect.get(rawRecord, key));
        Object.defineProperty(record, key, {
          configurable: true,
          enumerable: true,
          value,
          writable: true,
        });
      }
      records[index] = record;
    }
    return records;
  } catch {
    throw invalidResult();
  }
};

const serializedByteLength = (result: TextFsmParseResult): number => {
  try {
    const serialized = JSON.stringify(result);
    if (typeof serialized !== 'string') {
      throw invalidResult();
    }
    return new TextEncoder().encode(serialized).byteLength;
  } catch {
    throw invalidResult();
  }
};

export const parseWithPackage = (
  templateString: string,
  dataString: string,
): TextFsmParseResult => {
  const parser = new TxtFSM(templateString);
  const header = copyHeader(parser);
  const rawRecords: unknown = parser.parseTextToDicts(dataString);
  const records = copyRecords(rawRecords);

  const result = { header, records };
  const resultBytes = serializedByteLength(result);
  if (resultBytes > TEXTFSM_LIMITS.maxResultBytes) {
    throw new TextFsmEngineError(
      'RESULT_TOO_LARGE',
      `TextFSM result exceeds the maximum allowed size of ${TEXTFSM_LIMITS.maxResultBytes} bytes.`,
    );
  }

  return result;
};
