import { atom } from 'jotai';

import {
  cancelParsing,
  getParseRunner,
  primaryMode,
} from '@/features/textfsm/parserSelection';
import {
  addNotificationAtom,
  isPyodideLoadingAtom,
  pyodideFallbackNotificationIdAtom,
  pyodideLoadStatusAtom,
  responseStateAtom,
  resultViewValueAtom,
} from './atoms';
import {
  historyAutoSaveCountAtom,
  historyAutoSaveEnabledAtom,
  historyAutoSaveItemsAtom,
  parserModeAtom,
} from './storageAtoms';

import type { TextFsmParserMode } from '@/features/textfsm/types';
import type {
  HistoryAutoSaveItem,
  HistoryAutoSaveItemInfo,
  NotificationItemInfo,
} from '@/types';
import type { PyodideLoadStatus } from './atoms';

const pyodideLoadNotifications: Partial<
  Record<PyodideLoadStatus, NotificationItemInfo>
> = {
  ready: {
    type: 'success',
    title: 'Pyodide is ready',
    message: 'Python TextFSM is available in this browser.',
  },
  cancelled: {
    type: 'info',
    title: 'Pyodide loading cancelled',
    message: 'The download was stopped before Pyodide was ready.',
  },
  failed: {
    type: 'warning',
    title: 'Pyodide could not start',
    message: 'Python TextFSM could not be loaded.',
  },
};

export const reportPyodideLoadStatusAtom = atom(
  null,
  (_, set, status: PyodideLoadStatus | null) => {
    set(pyodideLoadStatusAtom, status);
    const notification =
      status === null ? undefined : pyodideLoadNotifications[status];
    const notificationId = notification
      ? set(addNotificationAtom, notification)
      : undefined;
    set(
      pyodideFallbackNotificationIdAtom,
      status === 'cancelled' || status === 'failed'
        ? notificationId
        : undefined,
    );
  },
);

export const changeParserModeAtom = atom(
  null,
  (get, set, mode: TextFsmParserMode) => {
    if (
      (mode !== 'local' && mode !== primaryMode) ||
      get(parserModeAtom) === mode
    )
      return;
    cancelParsing();
    set(responseStateAtom, 'init');
    set(resultViewValueAtom, undefined);
    set(reportPyodideLoadStatusAtom, null);
    set(parserModeAtom, mode);
  },
);

export const cancelPyodideLoadAtom = atom(null, (get, set) => {
  if (!get(isPyodideLoadingAtom)) return;
  getParseRunner('pyodide').invalidateActive();
  set(reportPyodideLoadStatusAtom, 'cancelled');
});

// Atom to add a new history auto-save item
export const addHistoryAutoSaveItemAtom = atom(
  null,
  (get, set, item: HistoryAutoSaveItemInfo) => {
    const historyAutoSaveItems = get(historyAutoSaveItemsAtom);
    const newItem: HistoryAutoSaveItem = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    set(historyAutoSaveItemsAtom, [newItem, ...historyAutoSaveItems]);
  },
);

// Atom to remove a history auto-save item by index
export const removeHistoryAutoSaveItemAtom = atom(
  null,
  (get, set, index: number) => {
    const historyAutoSaveItems = get(historyAutoSaveItemsAtom);
    const newHistoryAutoSaveItems = historyAutoSaveItems.filter(
      (_, i) => i !== index,
    );
    set(historyAutoSaveItemsAtom, newHistoryAutoSaveItems);
  },
);

// Atom to clear all history auto-save items
export const clearHistoryAutoSaveItemAtom = atom(null, (_, set) => {
  set(historyAutoSaveItemsAtom, []);
});

// If historyAutoSaveEnabled is True,
// add an item and remove the oldest item if the count exceeds
export const historyAutoSaveHandler = atom(
  null,
  (get, set, item: HistoryAutoSaveItemInfo) => {
    if (!get(historyAutoSaveEnabledAtom)) {
      return;
    }

    const items = get(historyAutoSaveItemsAtom);
    set(addHistoryAutoSaveItemAtom, item);

    const maxCount = get(historyAutoSaveCountAtom);

    if (items.length > maxCount) {
      set(historyAutoSaveItemsAtom, items.slice(0, maxCount));
    }
  },
);
