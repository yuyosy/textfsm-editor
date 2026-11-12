import {
  ActionIcon,
  CloseButton,
  Code,
  Divider,
  Group,
  Paper,
  Popover,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { CircleHelp, Layers, Search, Terminal } from 'lucide-react';

import { normalize } from '@/utils/stringHelpers';
import { usePlatformPriority } from './hooks/usePlatformPriority';

import type { PlatformTemplatesDict, SearchParams } from './types';

interface SearchFormProps {
  templates: PlatformTemplatesDict;
  searchParams: SearchParams;
  isAndCondition: boolean;
  isFuzzyEnabled: boolean;
  selectedPlatform: string | null;
  handleSearchParamsChange: (field: keyof SearchParams, value: string) => void;
  handlePlatformChange: (platform: string | null) => void;
  handleAndConditionChange: (value: boolean) => void;
  handleFuzzyEnabledChange: (value: boolean) => void;
}

export const SearchForm = ({
  templates,
  searchParams,
  isAndCondition,
  isFuzzyEnabled,
  selectedPlatform,
  handleSearchParamsChange,
  handlePlatformChange,
  handleAndConditionChange,
  handleFuzzyEnabledChange,
}: SearchFormProps) => {
  const { platformPriorities } = usePlatformPriority();
  const filtersDisabled = selectedPlatform === null;

  const groupedPlatforms = Object.keys(templates).reduce(
    (acc, platform) => {
      const priority =
        platformPriorities.find((p) => p.platform === platform)?.priority || 0;
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(platform);
      return acc;
    },
    {} as { [priority: number]: string[] },
  );

  const sortedGroups = Object.keys(groupedPlatforms)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="sm">
        <Select
          label="Platform"
          placeholder="Choose a platform"
          leftSection={<Layers size={16} aria-hidden="true" />}
          data={sortedGroups.map((priority) => ({
            group: `Priority ${priority}`,
            items: groupedPlatforms[priority].map((platform) => ({
              value: platform,
              label: normalize(platform),
            })),
          }))}
          value={selectedPlatform}
          onChange={handlePlatformChange}
          comboboxProps={{ shadow: 'lg' }}
          clearable
          clearButtonProps={{ 'aria-label': 'Clear platform' }}
          searchable
        />
        <SimpleGrid
          type="container"
          cols={{ base: 1, '28rem': 2 }}
          spacing="sm"
        >
          <TextInput
            label="Template name"
            placeholder="e.g. show_version"
            leftSection={<Search size={16} aria-hidden="true" />}
            disabled={filtersDisabled}
            value={searchParams.template}
            onChange={(e) =>
              handleSearchParamsChange('template', e.target.value)
            }
            rightSection={
              !filtersDisabled &&
              searchParams.template && (
                <CloseButton
                  aria-label="Clear template name"
                  size="sm"
                  onClick={() => handleSearchParamsChange('template', '')}
                />
              )
            }
          />
          <TextInput
            label="Command"
            placeholder="e.g. show version"
            leftSection={<Terminal size={16} aria-hidden="true" />}
            disabled={filtersDisabled}
            value={searchParams.command}
            onChange={(e) =>
              handleSearchParamsChange('command', e.target.value)
            }
            rightSection={
              !filtersDisabled &&
              searchParams.command && (
                <CloseButton
                  aria-label="Clear command"
                  size="sm"
                  onClick={() => handleSearchParamsChange('command', '')}
                />
              )
            }
          />
        </SimpleGrid>
        <Divider />
        <Group gap={8} justify="space-between">
          <Group gap="sm">
            <Switch
              size="sm"
              label="Match both fields"
              disabled={filtersDisabled}
              checked={isAndCondition}
              onChange={(e) =>
                handleAndConditionChange(e.currentTarget.checked)
              }
            />
            <Switch
              size="sm"
              label="Fuzzy match"
              disabled={filtersDisabled}
              checked={isFuzzyEnabled}
              onChange={(e) =>
                handleFuzzyEnabledChange(e.currentTarget.checked)
              }
            />
          </Group>
          <Popover width={260} shadow="md" withArrow>
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="About command patterns"
              >
                <CircleHelp size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">
                The command pattern <Code>abc[[xyz]]</Code> matches{' '}
                <Code>abc</Code>, <Code>abcx</Code>, <Code>abcxy</Code>, and{' '}
                <Code>abcxyz</Code>.
              </Text>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Stack>
    </Paper>
  );
};
