import { useState } from 'react';

import { ActionIcon, Group, Popover, Select, Stack, Text } from '@mantine/core';
import { useAtom, useSetAtom } from 'jotai';
import { CircleHelp } from 'lucide-react';

import { responseStateAtom, resultViewValueAtom } from '@/features/state/atoms';
import { parserModeAtom } from '@/features/state/storageAtoms';
import { cancelParsing } from '@/features/textfsm/parserSelection';

export const ParserModeSelect = () => {
  const [mode, setMode] = useAtom(parserModeAtom);
  const setResponseState = useSetAtom(responseStateAtom);
  const setResult = useSetAtom(resultViewValueAtom);
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
                Browser only:{' '}
              </Text>
              Runs entirely in your browser using TxtFSM, a compatible
              implementation. Your input and template are not sent to the
              backend. Some templates may fail to parse or produce different
              results from the original implementation.
            </Text>
            <Text size="sm">
              <Text span fw={600}>
                Backend request:{' '}
              </Text>
              Uses the original Python TextFSM implementation. Your input and
              template are sent to the backend for parsing.
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
          { value: 'local', label: 'Browser only' },
          { value: 'backend', label: 'Backend request' },
        ]}
        onChange={(value) => {
          if ((value !== 'local' && value !== 'backend') || value === mode)
            return;
          cancelParsing();
          setResponseState('init');
          setResult(undefined);
          setMode(value);
        }}
      />
    </Group>
  );
};
