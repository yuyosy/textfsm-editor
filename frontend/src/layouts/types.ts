import type { JSX, RefObject } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import type { ModalId } from './modals/types';

export type PanelLayoutType = 'both' | 'data' | 'template';

export interface PanelRefs {
  data: RefObject<PanelImperativeHandle | null>;
  template: RefObject<PanelImperativeHandle | null>;
  notification: RefObject<PanelImperativeHandle | null>;
  results: RefObject<PanelImperativeHandle | null>;
}

export interface DisclosureActions {
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export interface NavItem {
  id: ModalId;
  label: string;
  icon: JSX.Element;
}
