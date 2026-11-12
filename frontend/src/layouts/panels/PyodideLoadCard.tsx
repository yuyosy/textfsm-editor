import { Alert, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { useSetAtom } from 'jotai';

import { cancelPyodideLoadAtom } from '@/features/state/actionAtoms';

export const PyodideLoadCard = ({
  status,
}: {
  status: 'runtime' | 'package';
}) => {
  const cancel = useSetAtom(cancelPyodideLoadAtom);

  return (
    <Alert title="Loading Pyodide" color="gray" variant="light" p={10}>
      <Stack gap={8}>
        <Group gap={6} wrap="nowrap" align="start" role="status">
          <Loader size={12} aria-hidden="true" />
          <Text size="xs">
            {status === 'runtime'
              ? 'Downloading and starting the Python runtime.'
              : 'Downloading and loading Python TextFSM.'}
          </Text>
        </Group>
        <Button
          size="xs"
          variant="filled"
          color="red"
          onClick={cancel}
          styles={{ label: { whiteSpace: 'normal' } }}
          fullWidth
          h="auto"
          mih={36}
          py={6}
        >
          Cancel download
        </Button>
      </Stack>
    </Alert>
  );
};
