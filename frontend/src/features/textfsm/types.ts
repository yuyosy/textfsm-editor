export type TextFsmCellValue = string | string[];
export type TextFsmRecord = Record<string, TextFsmCellValue>;

export interface TextFsmParseInput {
  templateString: string;
  dataString: string;
}

export interface TextFsmParseResult {
  header: string[];
  records: TextFsmRecord[];
}

export type TextFsmErrorCode =
  | 'ABORTED'
  | 'DATA_TOO_LARGE'
  | 'INVALID_RESULT'
  | 'PACKAGE_ERROR'
  | 'RESULT_TOO_LARGE'
  | 'TEMPLATE_TOO_LARGE'
  | 'TIMED_OUT'
  | 'TOO_MANY_COLUMNS'
  | 'TOO_MANY_RECORDS'
  | 'WORKER_ERROR';

export interface TextFsmSerializedError {
  code: TextFsmErrorCode;
  message: string;
}

export class TextFsmEngineError extends Error {
  constructor(
    public readonly code: TextFsmErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TextFsmEngineError';
  }

  toJSON(): TextFsmSerializedError {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export interface TextFsmParseOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface TextFsmEngine {
  parse(
    input: TextFsmParseInput,
    options?: TextFsmParseOptions,
  ): Promise<TextFsmParseResult>;
  dispose(): void;
}
