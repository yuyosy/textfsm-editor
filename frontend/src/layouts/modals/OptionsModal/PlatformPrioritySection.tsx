import { ActionIcon, Group, Rating, Stack, Text } from '@mantine/core';
import { StarOff } from 'lucide-react';
import { DataTable } from 'mantine-datatable';

import { normalize } from '@/utils/stringHelpers';
import { useFetchTemplates } from '../PresetTemplatesModal/hooks/useFetchTemplates';
import { usePlatformPriority } from '../PresetTemplatesModal/hooks/usePlatformPriority';

export const PlatformPrioritySection = () => {
  const { platformPriorities, setPlatformPriority, removePlatformPriority } =
    usePlatformPriority();
  const { templates } = useFetchTemplates();

  const platforms = Object.keys(templates).map((platform) => {
    return {
      platform: platform,
      priority:
        platformPriorities.find((p) => p.platform === platform)?.priority || 0,
    };
  });

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Platform Priority
      </Text>
      <Text size="xs">
        Select your favorite platforms and set their priority.
      </Text>
      <Text size="xs" c="dimmed">
        The default value is 0, and higher values take precedence. Items with
        the same priority are sorted in ascending order.
      </Text>
      <DataTable
        idAccessor="platform"
        records={platforms}
        columns={[
          {
            accessor: 'platform',
            title: 'Platform',
            render: (record) => (
              <Text size="sm" style={{ overflowWrap: 'anywhere' }}>
                {normalize(record.platform)}
              </Text>
            ),
          },
          {
            accessor: 'priority',
            title: 'Priority',
            width: 132,
            render: (record) => (
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  size="sm"
                  color="gray"
                  variant="transparent"
                  aria-label={`Reset priority for ${normalize(record.platform)}`}
                  onClick={() => removePlatformPriority(record.platform)}
                >
                  <StarOff size={16} />
                </ActionIcon>
                <Rating
                  size="sm"
                  value={record.priority}
                  onChange={(value) =>
                    setPlatformPriority(record.platform, value)
                  }
                  count={5}
                />
              </Group>
            ),
          },
        ]}
        scrollAreaProps={{ scrollbars: false }}
        borderRadius="sm"
        withTableBorder
        withColumnBorders
      />
    </Stack>
  );
};
