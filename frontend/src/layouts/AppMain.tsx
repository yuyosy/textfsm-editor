import { useRef, useState } from 'react';
import {
  Group,
  Panel,
  type PanelImperativeHandle,
  useDefaultLayout,
} from 'react-resizable-panels';

import { AppShell, Paper, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSetAtom } from 'jotai';

import ResizeHandle from '@/components/resizable-panels/ResizeHandle';
import { addNotificationAtom } from '@/features/state/atoms';
import { useAutoRequest } from '@/hooks/useSendRequest';
import { AppMainToolBar } from './AppMainToolBar';
import {
  setChipPanelState,
  setSegmentedControlPanelState,
} from './panelStateUtils';
import { NotificationPanel } from './panels/NotificationPanel';
import { RawTextEditorPanel } from './panels/RawTextEditorPanel';
import { ResultViewPanel } from './panels/ResultViewPanel';
import { TemplateEditorPanel } from './panels/TemplateEditorPanel';

import type { PanelLayoutType, PanelRefs } from '@/layouts/types';

export const AppMain = () => {
  const [openedNotificationPanel, notificationPanelActions] =
    useDisclosure(false);
  const [openedResultViewPanel, resultViewPanelActions] = useDisclosure(false);

  const [mainPanelLyout, setMainPanelLyout] = useState<PanelLayoutType>('both');

  const topLayout = useDefaultLayout({ id: 'top' });
  const mainLayout = useDefaultLayout({ id: 'main' });
  const editorLayout = useDefaultLayout({ id: 'editor' });

  const addNotification = useSetAtom(addNotificationAtom);
  useAutoRequest(addNotification);

  // Ref State
  const panelRefs: PanelRefs = {
    data: useRef<PanelImperativeHandle>(null),
    template: useRef<PanelImperativeHandle>(null),
    notification: useRef<PanelImperativeHandle>(null),
    results: useRef<PanelImperativeHandle>(null),
  };

  const syncDataPanelSegmentedControlsOnResize = () => {
    setSegmentedControlPanelState(
      'template',
      panelRefs.data,
      mainPanelLyout,
      setMainPanelLyout,
    );
  };
  const syncTemplatePanelSegmentedControlsOnResize = () => {
    setSegmentedControlPanelState(
      'data',
      panelRefs.template,
      mainPanelLyout,
      setMainPanelLyout,
    );
  };
  const syncNotificationPanelStateChipOnResize = () => {
    setChipPanelState(
      openedNotificationPanel,
      panelRefs.notification,
      notificationPanelActions,
    );
  };
  const syncResultViewPanelStateChipOnResize = () => {
    setChipPanelState(
      openedResultViewPanel,
      panelRefs.results,
      resultViewPanelActions,
    );
  };

  return (
    <AppShell.Main bg="transparent">
      <Stack gap={0} pt={40} style={{ height: '100dvh' }}>
        <AppMainToolBar
          {...{
            panelRefs: panelRefs,
            mainPanelLyout: mainPanelLyout,
            setMainPanelLyout: setMainPanelLyout,
            openedNotificationPanel: openedNotificationPanel,
            notificationPanelActions: notificationPanelActions,
            openedResultViewPanel: openedResultViewPanel,
            resultViewPanelActions: resultViewPanelActions,
          }}
        />
        <Paper
          h="100%"
          m={8}
          radius="md"
          shadow="xs"
          style={{ overflow: 'hidden' }}
        >
          <Group id="top" orientation="horizontal" {...topLayout}>
            <Panel
              id="content-panel"
              defaultSize="80"
              collapsedSize="0"
              minSize="10"
              collapsible={true}
              style={{ overflow: 'hidden' }}
            >
              <Group id="main" orientation="vertical" {...mainLayout}>
                <Panel
                  id="main-panel"
                  defaultSize="70"
                  collapsedSize="0"
                  minSize="10"
                  collapsible={true}
                  style={{ overflow: 'hidden' }}
                >
                  <Group id="editor" orientation="horizontal" {...editorLayout}>
                    <RawTextEditorPanel
                      panelRef={panelRefs.data}
                      onResizeHandler={syncDataPanelSegmentedControlsOnResize}
                    />
                    <ResizeHandle />
                    <TemplateEditorPanel
                      panelRef={panelRefs.template}
                      onResizeHandler={
                        syncTemplatePanelSegmentedControlsOnResize
                      }
                    />
                  </Group>
                </Panel>
                <ResizeHandle />
                <ResultViewPanel
                  panelRef={panelRefs.results}
                  onResizeHandler={syncResultViewPanelStateChipOnResize}
                />
              </Group>
            </Panel>
            <ResizeHandle />
            <NotificationPanel
              panelRef={panelRefs.notification}
              onResizeHandler={syncNotificationPanelStateChipOnResize}
            />
          </Group>
        </Paper>
      </Stack>
    </AppShell.Main>
  );
};
