import type { RefObject } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import type { DisclosureActions, PanelLayoutType } from './types';

export const setSegmentedControlPanelState = (
  activatePanelName: PanelLayoutType,
  panelImperativeHandleRef: RefObject<{
    isCollapsed: () => boolean;
  } | null>,
  currentPanelLyout: PanelLayoutType,
  setMainPanelLyout: (value: PanelLayoutType) => void,
) => {
  if (
    currentPanelLyout === 'both' &&
    panelImperativeHandleRef?.current?.isCollapsed()
  ) {
    setMainPanelLyout(activatePanelName);
  }
  if (
    currentPanelLyout === activatePanelName &&
    panelImperativeHandleRef.current &&
    !panelImperativeHandleRef.current.isCollapsed()
  ) {
    setMainPanelLyout('both');
  }
};

export const setChipPanelState = (
  isOpen: boolean,
  ref: RefObject<PanelImperativeHandle | null>,
  actions: DisclosureActions,
) => {
  if (isOpen && ref?.current?.isCollapsed()) {
    actions.close();
  }
  if (!isOpen && ref.current && !ref.current.isCollapsed()) {
    actions.open();
  }
};

export const handlePanelToggle = (
  toExpand: boolean,
  ref: RefObject<PanelImperativeHandle | null>,
  actions: DisclosureActions,
) => {
  const panel = ref.current;
  if (panel && toExpand) {
    panel.expand();
    actions.open();
  } else if (panel && !toExpand) {
    panel.collapse();
    actions.close();
  }
};
