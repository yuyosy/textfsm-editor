export type TextFsmListItem = string | Record<string, string | null>;
export type TextFsmCellValue = string | TextFsmListItem[];
export type TextFsmParserMode = 'local' | 'backend' | 'pyodide';
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
  | 'PYODIDE_INIT'
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

export class TextFsmParseError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = 'TextFsmParseError';
  }
}

export type ParserInitializationPhase =
  | 'runtime'
  | 'package'
  | 'ready'
  | 'failed'
  | 'interrupted';

export interface TextFsmParseOptions {
  onInitializationChange?: (phase: ParserInitializationPhase) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface TextFsmEngine {
  parse(
    input: TextFsmParseInput,
    options?: TextFsmParseOptions,
  ): Promise<TextFsmParseResult>;
  preload?(options?: TextFsmParseOptions): Promise<void>;
  dispose(): void;
}
