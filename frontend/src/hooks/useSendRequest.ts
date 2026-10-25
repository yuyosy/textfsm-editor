import { useCallback, useEffect, useRef } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';

import { historyAutoSaveHandler } from '@/features/state/actionAtoms';
import { responseStateAtom, resultViewValueAtom } from '@/features/state/atoms';
import {
  autoRequestEnabledAtom,
  parseRequestDelayAtom,
  parserModeAtom,
  rawTextEditorValueAtom,
  templateEditorValueAtom,
} from '@/features/state/storageAtoms';
import { getParseRunner } from '@/features/textfsm/parserSelection';

import type { TextFsmParseRunner } from '@/features/textfsm/parseRunner';
import type { NotificationItemInfo } from '@/types';

interface UseSendRequestOptions {
  parseRunner?: TextFsmParseRunner;
}

const useParseRunner = (override?: TextFsmParseRunner) => {
  const mode = useAtomValue(parserModeAtom);
  return override ?? getParseRunner(mode);
};

export const useSendRequest = (options: UseSendRequestOptions = {}) => {
  const parseRunner = useParseRunner(options.parseRunner);
  const readRawText = useAtomCallback(
    useCallback((get) => {
      return get(rawTextEditorValueAtom);
    }, []),
  );
  const readTemplate = useAtomCallback(
    useCallback((get) => {
      return get(templateEditorValueAtom);
    }, []),
  );
  const setResponseState = useSetAtom(responseStateAtom);
  const setResultViewValue = useSetAtom(resultViewValueAtom);
  const autoSaveHandler = useSetAtom(historyAutoSaveHandler);
  const ownerIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    return () => {
      parseRunner.abortOwner(ownerIdRef.current);
    };
  }, [parseRunner]);

  const sendRequest = useCallback(
    async (_immediate = false) => {
      const template = readTemplate();
      if (template === '') {
        return { response: null, notification: null };
      }
      const data = readRawText();
      const result = await parseRunner.parse(ownerIdRef.current, {
        dataString: data,
        templateString: template,
      });

      if (result.response === null) {
        return result;
      }

      setResponseState(result.response.ok ? 'success' : 'error');
      setResultViewValue(result.response);

      if (result.response.ok && result.response.data) {
        autoSaveHandler({
          template,
          data,
          result: JSON.stringify(result.response.data.results, null, 2),
          status: 'success',
        });
      } else if (!result.response.ok && result.response.errors) {
        autoSaveHandler({
          template,
          data,
          result: '',
          status: 'error',
        });
      }

      return result;
    },
    [
      readTemplate,
      readRawText,
      parseRunner,
      setResponseState,
      setResultViewValue,
      autoSaveHandler,
    ],
  );

  return sendRequest;
};

export const useAutoRequest = (
  onNotification?: (notification: NotificationItemInfo) => void,
  options: UseSendRequestOptions = {},
) => {
  const parseRunner = useParseRunner(options.parseRunner);
  const rawText = useAtomValue(rawTextEditorValueAtom);
  const template = useAtomValue(templateEditorValueAtom);
  const enabled = useAtomValue(autoRequestEnabledAtom);
  const delay = useAtomValue(parseRequestDelayAtom);
  const sendRequest = useSendRequest({ parseRunner });
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reparse on raw input changes; sendRequest reads its current atom value.
  useEffect(() => {
    if (!enabled) return;
    parseRunner.invalidateActive();
    if (template === '') return;
    const timeout = setTimeout(async () => {
      const result = await sendRequest(true);
      if (result.notification) onNotification?.(result.notification);
    }, delay);
    return () => clearTimeout(timeout);
  }, [
    enabled,
    rawText,
    template,
    delay,
    parseRunner,
    sendRequest,
    onNotification,
  ]);
};
