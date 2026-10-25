import { useCallback, useEffect, useRef } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';

import { historyAutoSaveHandler } from '@/features/state/actionAtoms';
import { responseStateAtom, resultViewValueAtom } from '@/features/state/atoms';
import {
  autoRequestEnabledAtom,
  parseRequestDelayAtom,
  rawTextEditorValueAtom,
  templateEditorValueAtom,
} from '@/features/state/storageAtoms';
import { textFsmParseRunner } from '@/features/textfsm/parseRunner';

import type { TextFsmParseRunner } from '@/features/textfsm/parseRunner';
import type { NotificationItemInfo } from '@/types';

interface UseSendRequestOptions {
  parseRunner?: TextFsmParseRunner;
}

export const useSendRequest = ({
  parseRunner = textFsmParseRunner,
}: UseSendRequestOptions = {}) => {
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

  const sendRequest = async (_immediate = false) => {
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
  };

  return sendRequest;
};

export const useAutoRequest = (
  onNotification?: (notification: NotificationItemInfo) => void,
  { parseRunner = textFsmParseRunner }: UseSendRequestOptions = {},
) => {
  useAtomValue(rawTextEditorValueAtom);
  useAtomValue(templateEditorValueAtom);
  const sendRequest = useSendRequest({ parseRunner });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValuesRef = useRef({ rawText: '', template: '' });

  const processAutoRequest = useAtomCallback(
    useCallback(
      (get) => {
        if (!get(autoRequestEnabledAtom)) {
          return;
        }

        const currentValues = {
          rawText: get(rawTextEditorValueAtom),
          template: get(templateEditorValueAtom),
        };

        if (
          currentValues.rawText === lastValuesRef.current.rawText &&
          currentValues.template === lastValuesRef.current.template
        ) {
          return;
        }

        parseRunner.invalidateActive();
        lastValuesRef.current = currentValues;

        if (currentValues.template === '') {
          return;
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
          const result = await sendRequest(true);
          if (result.notification && onNotification) {
            onNotification(result.notification);
          }
          timeoutRef.current = null;
        }, get(parseRequestDelayAtom));
      },
      [parseRunner, sendRequest, onNotification],
    ),
  );

  useEffect(() => {
    processAutoRequest();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [processAutoRequest]);
};
