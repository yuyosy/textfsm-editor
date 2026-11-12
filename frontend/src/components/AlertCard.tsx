import { memo, type ReactNode } from 'react';

import { Alert, Badge, Box, Text, Tooltip } from '@mantine/core';

type Props = {
  mainTitle: string;
  timestamp: string;
  color: string;
  message: string;
  badgeLabel?: string;
  action?: ReactNode;
  onClose?: () => void;
};

export const AlertCard = memo<Props>(
  ({ mainTitle, timestamp, color, message, badgeLabel, action, onClose }: Props) => {
    return (
      <Alert
        title={
          <Tooltip label={timestamp} position="bottom-start">
            <Text fw={700} c={color}>
              {mainTitle}
            </Text>
          </Tooltip>
        }
        color={color}
        p={10}
        withCloseButton={!!onClose}
        onClose={onClose}
      >
        {badgeLabel && (
          <Box mb={4}>
            <Badge variant="light" color="gray" size="xs" tt="none">
              {badgeLabel}
            </Badge>
          </Box>
        )}
        {message}
        {action && <Box mt={4}>{action}</Box>}
      </Alert>
    );
  },
);
