import { TEXTFSM_LIMITS } from '../limits';

import type { TextFsmErrorCode, TextFsmParseResult } from '../types';
import type { WorkerRequest, WorkerResponse } from './protocol';

type PythonResult =
  | { result: TextFsmParseResult }
  | { error: 'TOO_MANY_COLUMNS' | 'TOO_MANY_RECORDS' }
  | { reason: string; message: string };
type PythonParser = (template: string, data: string) => string;
type PyodideRuntime = {
  loadPackage(url: string): Promise<void>;
  runPython(code: string): unknown;
};

let parserPromise: Promise<PythonParser> | undefined;

async function initialize(id: string): Promise<PythonParser> {
  // Check that this worker can compile Wasm before downloading the runtime.
  await WebAssembly.compile(Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0));
  const runtimeUrl = new URL(
    import.meta.env.VITE_PYODIDE_RUNTIME_URL,
    self.location.origin,
  ).href;
  const wheelUrl = new URL(
    import.meta.env.VITE_TEXTFSM_WHEEL_URL,
    self.location.origin,
  ).href;
  const { loadPyodide } = (await import(/* @vite-ignore */ runtimeUrl)) as {
    loadPyodide(): Promise<PyodideRuntime>;
  };
  const pyodide = await loadPyodide();
  send({ id, type: 'loading-package' });
  await pyodide.loadPackage(wheelUrl);
  return pyodide.runPython(`
import json
from io import StringIO
from textfsm import TextFSM, TextFSMError, TextFSMTemplateError

def parse(template, data):
    try:
        fsm = TextFSM(StringIO(template))
        if len(fsm.header) > ${TEXTFSM_LIMITS.maxColumns}:
            return json.dumps({"error": "TOO_MANY_COLUMNS"})
        records = fsm.ParseTextToDicts(data)
        if len(records) > ${TEXTFSM_LIMITS.maxRecords}:
            return json.dumps({"error": "TOO_MANY_RECORDS"})
        return json.dumps({"result": {"header": fsm.header, "records": records}}, ensure_ascii=False)
    except (TextFSMError, TextFSMTemplateError) as error:
        return json.dumps({"reason": type(error).__name__, "message": str(error)})

parse
`) as PythonParser;
}

function send(response: WorkerResponse): void {
  self.postMessage(response);
}

function fail(id: string, code: TextFsmErrorCode, message = ''): void {
  send({ id, type: 'failure', error: { code, message } });
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  const { id } = request;
  let parse: PythonParser;
  try {
    parserPromise ??= initialize(id);
    parse = await parserPromise;
  } catch {
    fail(id, 'PYODIDE_INIT');
    return;
  }

  if (request.type === 'initialize') {
    send({ id, type: 'initialized' });
    return;
  }

  const { input } = request;
  send({ id, type: 'started' });
  try {
    const json = parse(input.templateString, input.dataString);
    if (
      new TextEncoder().encode(json).byteLength > TEXTFSM_LIMITS.maxResultBytes
    ) {
      fail(id, 'RESULT_TOO_LARGE');
      return;
    }
    const output = JSON.parse(json) as PythonResult;
    if ('result' in output) {
      send({ id, type: 'success', result: output.result });
    } else if ('error' in output) {
      fail(id, output.error);
    } else {
      send({
        id,
        type: 'failure',
        error: {
          code: 'PACKAGE_ERROR',
          reason: output.reason,
          message: output.message,
        },
      });
    }
  } catch {
    fail(id, 'WORKER_ERROR');
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  void handleRequest(event.data);
};
