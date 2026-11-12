import { useState } from 'react';

import { ActionIcon, Group, Popover, Select, Stack, Text } from '@mantine/core';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleHelp } from 'lucide-react';

import { changeParserModeAtom } from '@/features/state/actionAtoms';
import { parserModeAtom } from '@/features/state/storageAtoms';
import { primaryMode } from '@/features/textfsm/parserSelection';

const isPyodide = primaryMode === 'pyodide';
const primaryLabel = isPyodide ? 'Pyodide' : 'Backend';

export const ParserModeSelect = () => {
  const mode = useAtomValue(parserModeAtom);
  const changeMode = useSetAtom(changeParserModeAtom);
  const [helpOpened, setHelpOpened] = useState(false);
  const [dropdownOpened, setDropdownOpened] = useState(false);
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm">Processing mode</Text>
      <Popover
        width={360}
        position="bottom-start"
        withArrow
        opened={helpOpened}
        onChange={setHelpOpened}
      >
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            size="sm"
            aria-label="About processing modes"
            aria-expanded={helpOpened}
            onClick={() => {
              setDropdownOpened(false);
              setHelpOpened((opened) => !opened);
            }}
          >
            <CircleHelp size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="sm">
            <Text size="sm">
              <Text span fw={600}>
                {primaryLabel}:{' '}
              </Text>
              {isPyodide
                ? 'Runs Python TextFSM in your browser. The first download can take a while.'
                : 'Runs Python TextFSM on the server. Your input and template are sent to the backend.'}
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                JS compatibility:{' '}
              </Text>
              {isPyodide
                ? 'Use this lightweight browser parser if Pyodide is slow to load or cannot start.'
                : 'Runs a lightweight browser parser without sending your input or template to the server.'}{' '}
              Some templates may produce different results from Python TextFSM.
            </Text>
          </Stack>
        </Popover.Dropdown>
      </Popover>
      <Select
        aria-label="Processing mode"
        size="xs"
        w={170}
        value={mode}
        allowDeselect={false}
        dropdownOpened={dropdownOpened}
        onDropdownOpen={() => {
          setHelpOpened(false);
          setDropdownOpened(true);
        }}
        onDropdownClose={() => setDropdownOpened(false)}
        data={[
          { value: primaryMode, label: primaryLabel },
          { value: 'local', label: 'JS compatibility' },
        ]}
        onChange={(value) => {
          if (value === 'local' || value === primaryMode) changeMode(value);
        }}
      />
    </Group>
  );
};
