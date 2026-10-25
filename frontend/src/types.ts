import type { TextFsmRecord } from '@/features/textfsm/types';
import type { StatusBadgeVariant } from './components/StatusBadge';

export interface ResponseResult {
  ok: boolean;
  message: string;
  message_detail: string;
  headers: string[];
  results: object[];
}

export interface ResultObject {
  ok: boolean;
  timestamp: string;
  response_result: ResponseResult;
  result_message: string;
  result_message_detail: string;
}

export interface ResultData {
  message: string;
  header: string[];
  results: TextFsmRecord[];
}

export interface ResultError {
  status: string;
  reason: string;
  message: string;
}

interface Timestamp {
  timestamp: string;
}

export interface ResultItem extends Timestamp {
  ok: boolean;
  status: string;
  code: number;
  data: ResultData | undefined;
  errors: ResultError[] | undefined;
}

export interface HistoryAutoSaveItem {
  timestamp: string;
  template: string;
  data: string;
  result: string;
  status: StatusBadgeVariant;
}
export type HistoryAutoSaveItemInfo = Omit<HistoryAutoSaveItem, 'timestamp'>;

export type NotificationType = 'api' | 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type NotificationItemInfo = Omit<Notification, 'id' | 'timestamp'>;
