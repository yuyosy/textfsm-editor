import {
  Badge,
  Button,
  type DefaultMantineColor,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { DataTable } from 'mantine-datatable';

import { normalize } from '@/utils/stringHelpers';

import type { MatchType, SearchedTemplateInfo } from './types';

interface TemplateTableProps {
  templates: SearchedTemplateInfo[];
  loading: boolean;
  onSelectTemplate: (template: SearchedTemplateInfo) => void;
}

const badgeStyles: Record<
  MatchType,
  { color: DefaultMantineColor; label: string }
> = {
  regex: { color: 'green', label: 'Regex Match' },
  fuzzy: { color: 'blue', label: 'Fuzzy Match' },
  all: { color: 'gray', label: 'All' },
};

export const TemplateTable = ({
  templates,
  loading,
  onSelectTemplate,
}: TemplateTableProps) => {
  return (
    <DataTable
      height={300}
      minHeight={300}
      withTableBorder
      noRecordsText="Select a platform to view templates"
      borderRadius="sm"
      striped
      idAccessor={(item) => item.template + item.platform + item.commandRaw}
      fetching={loading}
      records={templates}
      scrollAreaProps={{ type: 'always', offsetScrollbars: 'y' }}
      columns={[
        {
          accessor: 'template',
          title: 'Template',
          render: (record) => (
            <Stack gap={0}>
              <Text>{record.template}</Text>
              <Text size="xs" c="dimmed" p={4}>
                {record.commandRaw}
              </Text>
              <Group gap={8}>
                <Badge
                  variant="default"
                  color="blue.5"
                  radius="sm"
                  size="xs"
                  tt="unset"
                >
                  {normalize(record.platform)}
                </Badge>
                {record.matchType === 'all' ? (
                  ''
                ) : (
                  <Badge
                    variant="dot"
                    color={badgeStyles[record.matchType].color}
                    radius="sm"
                    size="xs"
                    tt="capitalize"
                  >
                    {badgeStyles[record.matchType].label}
                  </Badge>
                )}
              </Group>
            </Stack>
          ),
        },
        {
          accessor: 'actions',
          title: 'Select',
          render: (record) => (
            <Button
              variant="default"
              size="xs"
              onClick={() => onSelectTemplate(record)}
            >
              Select
            </Button>
          ),
        },
      ]}
    />
  );
};
