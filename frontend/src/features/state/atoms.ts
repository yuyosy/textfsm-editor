import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

import type { StatusBadgeVariant } from '@/components/StatusBadge';
import type { ParserInitializationPhase } from '@/features/textfsm/types';
import type { ModalState } from '@/layouts/modals/types';
import type { Notification, NotificationItemInfo, ResultItem } from '@/types';

export const responseStateAtom = atom<StatusBadgeVariant>('init');
export const responseResultsAtom = atomWithReset<ResultItem[]>([]);
export const resultViewValueAtom = atom<ResultItem>();

export const controlModalAtom = atom<ModalState>({
  opened: false,
  type: 'not-active',
});

export const notificationsAtom = atom<Notification[]>([]);
export type PyodideLoadStatus =
  | Exclude<ParserInitializationPhase, 'interrupted'>
  | 'cancelled';
export const pyodideLoadStatusAtom = atom<PyodideLoadStatus | null>(null);
export const pyodideFallbackNotificationIdAtom = atom<string | undefined>(
  undefined,
);
export const isPyodideLoadingAtom = atom((get) => {
  const status = get(pyodideLoadStatusAtom);
  return status === 'runtime' || status === 'package';
});

// add notification action
export const addNotificationAtom = atom(
  null,
  (get, set, notification: NotificationItemInfo) => {
    if (!notification) {
      return;
    }
    const notifications = get(notificationsAtom);
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    set(notificationsAtom, [newNotification, ...notifications]);
    return newNotification.id;
  },
);

// remove notification action
export const removeNotificationAtom = atom(
  null,
  (get, set, notificationId: string) => {
    const notifications = get(notificationsAtom);
    set(
      notificationsAtom,
      notifications.filter((n) => n.id !== notificationId),
    );
  },
);

// clear all notifications action
export const clearNotificationsAtom = atom(null, (_, set) => {
  set(notificationsAtom, []);
});
