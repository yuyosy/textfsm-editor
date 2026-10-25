import { Button, Chip, Divider, Group, Switch, Text } from '@mantine/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { Send } from 'lucide-react';

import { addNotificationAtom } from '@/features/state/atoms';
import { autoRequestEnabledAtom } from '@/features/state/storageAtoms';
import { useSendRequest } from '@/hooks/useSendRequest';
import { PanelSelector } from './PanelSelector';
import { ParserModeSelect } from './ParserModeSelect';
import { handlePanelToggle } from './panelStateUtils';

import type { Dispatch, SetStateAction } from 'react';
import type { DisclosureActions, PanelLayoutType, PanelRefs } from './types';

const PanelToggleChip = ({
  opened: panel,
  label,
  handlePanelToggle,
}: {
  opened: boolean;
  label: string;
  handlePanelToggle: (checked: boolean) => void;
}) => {
  return (
    <Chip
      variant="outline"
      size="xs"
      checked={panel}
      onChange={handlePanelToggle}
    >
      {label}
    </Chip>
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
        <PanelToggleChip
          opened={openedNotificationPanel}
          label="NotificationPanel"
          handlePanelToggle={(checked: boolean) => {
            handlePanelToggle(
              checked,
              panelRefs.notification,
              notificationPanelActions,
            );
          }}
        />
        <PanelToggleChip
          opened={openedResultViewPanel}
          label="ResultViewPanel"
          handlePanelToggle={(checked: boolean) => {
            handlePanelToggle(
              checked,
              panelRefs.results,
              resultViewPanelActions,
            );
          }}
        />
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
