import { useEffect } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';

import { reportPyodideLoadStatusAtom } from '@/features/state/actionAtoms';
import {
  parserModeAtom,
  pyodidePreloadEnabledAtom,
} from '@/features/state/storageAtoms';
import {
  cancelPrimaryPreload,
  preloadPrimaryParser,
} from '@/features/textfsm/parserSelection';

export function usePyodidePreload() {
  const enabled = useAtomValue(pyodidePreloadEnabledAtom);
  const mode = useAtomValue(parserModeAtom);
  const reportLoadStatus = useSetAtom(reportPyodideLoadStatusAtom);

  useEffect(() => {
    if (!enabled || mode !== 'pyodide') return;
    const start = setTimeout(() => {
      preloadPrimaryParser((phase) =>
        reportLoadStatus(phase === 'interrupted' ? null : phase),
      );
    }, 0);
    return () => {
      clearTimeout(start);
      cancelPrimaryPreload();
    };
  }, [enabled, mode, reportLoadStatus]);
}
