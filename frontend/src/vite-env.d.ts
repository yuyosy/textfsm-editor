/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
declare const __API_ENTRYPOINT__: string;

interface ImportMetaEnv {
  readonly VITE_MONACO_BASE_URL?: string;
  readonly VITE_PYODIDE_RUNTIME_URL: string;
  readonly VITE_TEXTFSM_WHEEL_URL: string;
}
