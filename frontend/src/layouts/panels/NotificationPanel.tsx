import { useEffect } from 'react';
import { Panel, type PanelImperativeHandle } from 'react-resizable-panels';

import {
  ActionIcon,
  Box,
  Button,
  Center,
  Flex,
  Group,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { BellOff, Eraser } from 'lucide-react';

import { AlertCard } from '@/components/AlertCard';
import { changeParserModeAtom } from '@/features/state/actionAtoms';
import {
  addNotificationAtom,
  clearNotificationsAtom,
  notificationsAtom,
  pyodideFallbackNotificationIdAtom,
  pyodideLoadStatusAtom,
  removeNotificationAtom,
} from '@/features/state/atoms';
import { autoRequestEnabledAtom } from '@/features/state/storageAtoms';
import { getParseRunner } from '@/features/textfsm/parserSelection';
import { TEXTFSM_PARSER_LABELS } from '@/features/textfsm/types';
import { useSendRequest } from '@/hooks/useSendRequest';
import { PyodideLoadCard } from './PyodideLoadCard';

import type { RefObject } from 'react';
import type { Notification } from '@/types';

interface NotificationPanelProps {
  panelRef: RefObject<PanelImperativeHandle | null>;
  onResizeHandler: () => void;
}

const getColorByType = (type: Notification['type']): string => {
  switch (type) {
    case 'success':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'api':
      return 'blue';
    default:
      return 'gray';
  }
};

export const NotificationPanel = ({
  panelRef,
  onResizeHandler,
}: NotificationPanelProps) => {
  const notifications = useAtomValue(notificationsAtom);
  const loadStatus = useAtomValue(pyodideLoadStatusAtom);
  const loading = loadStatus === 'runtime' || loadStatus === 'package';
  const fallbackNotificationId = useAtomValue(
    pyodideFallbackNotificationIdAtom,
  );
  const hasLoadStatus = loadStatus !== null;
  const clearNotifications = useSetAtom(clearNotificationsAtom);
  const removeNotification = useSetAtom(removeNotificationAtom);
  const autoParse = useAtomValue(autoRequestEnabledAtom);
  const changeMode = useSetAtom(changeParserModeAtom);
  const notify = useSetAtom(addNotificationAtom);
  const sendWithJs = useSendRequest({ parseRunner: getParseRunner('local') });

  useEffect(() => {
    const panel = panelRef.current;
    if (!hasLoadStatus || !panel) return;
    if (panel.isCollapsed()) panel.expand();
    if (panel.getSize().inPixels < 180) panel.resize(180);
  }, [hasLoadStatus, panelRef]);

  const handleUseJs = async () => {
    changeMode('local');
    if (autoParse) return;
    const { notification } = await sendWithJs(true);
    if (notification) notify(notification);
  };

  return (
    <Panel
      id="notification-panel"
      defaultSize="20"
      collapsedSize="0"
      minSize="10"
      collapsible={true}
      panelRef={panelRef}
      onResize={onResizeHandler}
      style={{ overflow: 'hidden' }}
    >
      <Stack gap={0} h="100%" style={{ overflow: 'hidden' }}>
        <Group px={10} py={8} justify="space-between" style={{ flexShrink: 0 }}>
          <Text fw={700}>Notifications</Text>
          <Tooltip label="Clear all" withArrow position="bottom">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={clearNotifications}
              aria-label="Clear all notifications"
            >
              <Eraser size={22} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {loading && (
          <Box px={10} pb={8}>
            <PyodideLoadCard status={loadStatus} />
          </Box>
        )}
        {notifications.length === 0 && !loading ? (
          <Center w="100%" h="100%">
            <Flex align="center" direction="column">
              <Box className="mantine-datatable-empty-state-icon">
                <BellOff color="#868e96" />
              </Box>
              <Text fz="sm" c="dimmed">
                No notifications
              </Text>
            </Flex>
          </Center>
        ) : (
          <ScrollArea
            style={{ flex: 1, minHeight: 0 }}
            type="auto"
            scrollbarSize={8}
          >
            <Stack p={10} pr={16} gap="xs">
              {notifications.map((notification) => (
                <AlertCard
                  key={notification.id}
                  mainTitle={notification.title}
                  timestamp={notification.timestamp}
                  color={getColorByType(notification.type)}
                  badgeLabel={
                    notification.parserMode
                      ? TEXTFSM_PARSER_LABELS[notification.parserMode]
                      : undefined
                  }
                  message={
                    notification.id === fallbackNotificationId
                      ? 'Select Send to try again.'
                      : notification.message
                  }
                  action={
                    notification.id === fallbackNotificationId && (
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={handleUseJs}
                        styles={{ label: { whiteSpace: 'normal' } }}
                        h="auto"
                        fullWidth
                        mih={36}
                        py={6}
                      >
                        Use JS compatibility
                      </Button>
                    )
                  }
                  onClose={() => removeNotification(notification.id)}
                />
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Panel>
  );
};
