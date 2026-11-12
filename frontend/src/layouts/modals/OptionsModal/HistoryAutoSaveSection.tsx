import { NumberInput, Select, Stack, Switch, Text } from '@mantine/core';
import { useAtom } from 'jotai';

import {
  historyAutoSaveCountAtom,
  historyAutoSaveEnabledAtom,
  historyAutoSaveExcludeErrorsAtom,
  historyPageSizeAtom,
} from '@/features/state/storageAtoms';

import type React from 'react';

export const HistoryAutoSaveSection: React.FC = () => {
  const [enabled, setEnabled] = useAtom(historyAutoSaveEnabledAtom);
  const [excludeErrors, setExcludeErrors] = useAtom(
    historyAutoSaveExcludeErrorsAtom,
  );
  const [saveCount, setSaveCount] = useAtom(historyAutoSaveCountAtom);
  const [pageSize, setPageSize] = useAtom(historyPageSizeAtom);

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        History Auto Save Options
      </Text>
      <Text size="xs">
        Configure the settings to temporarily save the template, data, and
        results during editor editing.
      </Text>{' '}
      <Text size="xs" c="dimmed">
        History data is saved in LocalStorage. The oldest entries will be
        automatically deleted when the limit is exceeded.
      </Text>
      <Switch
        label="Enable auto save"
        checked={enabled}
        onChange={(event) => setEnabled(event.currentTarget.checked)}
      />
      <Switch
        label="Exclude errors from auto-save"
        description="Already saved entries are kept."
        checked={excludeErrors}
        disabled={!enabled}
        onChange={(event) => setExcludeErrors(event.currentTarget.checked)}
      />
      <NumberInput
        label="Number of histories to auto save"
        min={1}
        max={300}
        value={saveCount}
        onChange={(value) =>
          setSaveCount(
            typeof value === 'string' ? parseInt(value, 10) || 0 : value || 0,
          )
        }
        disabled={!enabled}
        allowDecimal={false}
        allowNegative={false}
      />
      <Select
        label="Default Page Size"
        data={['10', '25', '50', '100']}
        value={pageSize.toString()}
        onChange={(value) => setPageSize(Number(value))}
        allowDeselect={false}
      />
    </Stack>
  );
};
