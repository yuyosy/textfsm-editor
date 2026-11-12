import { Button, Divider, Group, Switch, Text } from '@mantine/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { Bell, Send, Table2 } from 'lucide-react';

import { addNotificationAtom } from '@/features/state/atoms';
import { autoRequestEnabledAtom } from '@/features/state/storageAtoms';
import { useSendRequest } from '@/hooks/useSendRequest';
import { PanelSelector } from './PanelSelector';
import { ParserModeSelect } from './ParserModeSelect';
import { handlePanelToggle } from './panelStateUtils';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { DisclosureActions, PanelLayoutType, PanelRefs } from './types';

const PanelToggle = ({
  opened,
  label,
  panelId,
  icon,
  onToggle,
}: {
  opened: boolean;
  label: string;
  panelId: string;
  icon: ReactNode;
  onToggle: (opened: boolean) => void;
}) => {
  return (
    <Button
      variant={opened ? 'filled' : 'default'}
      color="blue.8"
      size="xs"
      px={8}
      leftSection={icon}
      aria-controls={panelId}
      aria-pressed={opened}
      onClick={() => onToggle(!opened)}
    >
      {label}
    </Button>
  );
};

interface AppMainToolBarProps {
  panelRefs: PanelRefs;
  mainPanelLyout: PanelLayoutType;
  setMainPanelLyout: Dispatch<SetStateAction<PanelLayoutType>>;
  openedNotificationPanel: boolean;
  notificationPanelActions: DisclosureActions;
  openedResultViewPanel: boolean;
  resultViewPanelActions: DisclosureActions;
}

export const AppMainToolBar = ({
  panelRefs,
  mainPanelLyout,
  setMainPanelLyout,
  openedNotificationPanel,
  notificationPanelActions,
  openedResultViewPanel,
  resultViewPanelActions,
}: AppMainToolBarProps) => {
  const editorAutoRequest = useAtomValue(autoRequestEnabledAtom);
  const setEditorAutoRequest = useSetAtom(autoRequestEnabledAtom);
  const sendRequest = useSendRequest();
  const addNotification = useSetAtom(addNotificationAtom);

  const handleClickSendRequest = async () => {
    const result = await sendRequest(true);
    if (result.notification) {
      addNotification(result.notification);
    }
  };

  return (
    <Group mx={8} justify="space-between">
      <Group gap={5}>
        <PanelSelector
          mainPanelLyout={mainPanelLyout}
          setMainPanelLyout={setMainPanelLyout}
          dataPanelImperativeHandleRef={panelRefs.data}
          templatePanelImperativeHandleRef={panelRefs.template}
        />
        <Divider
          orientation="vertical"
          color="var(--mantine-color-default-border)"
        />
        <Group gap={4} wrap="nowrap" role="group" aria-label="Panel visibility">
          <PanelToggle
            opened={openedNotificationPanel}
            label="Notifications"
            panelId="notification-panel"
            icon={<Bell size={14} aria-hidden="true" />}
            onToggle={(opened) =>
              handlePanelToggle(
                opened,
                panelRefs.notification,
                notificationPanelActions,
              )
            }
          />
          <PanelToggle
            opened={openedResultViewPanel}
            label="Results"
            panelId="result-panel"
            icon={<Table2 size={14} aria-hidden="true" />}
            onToggle={(opened) =>
              handlePanelToggle(
                opened,
                panelRefs.results,
                resultViewPanelActions,
              )
            }
          />
        </Group>
      </Group>
      <Group>
        <ParserModeSelect />
        {/* Actions */}
        <Button
          size="xs"
          variant="default"
          leftSection={<Send size="1.125rem" />}
          onClick={handleClickSendRequest}
        >
          Send
        </Button>
        <Divider
          orientation="vertical"
          color="var(--mantine-color-default-border)"
        />
        <Text size="sm">AutoParse</Text>
        <Switch
          labelPosition="left"
          onLabel="ON"
          offLabel="OFF"
          checked={editorAutoRequest}
          onChange={(event) =>
            setEditorAutoRequest(event.currentTarget.checked)
          }
        />
      </Group>
    </Group>
  );
};
