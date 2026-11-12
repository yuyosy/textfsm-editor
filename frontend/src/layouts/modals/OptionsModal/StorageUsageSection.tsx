import { useEffect, useId, useState } from 'react';

import {
  Anchor,
  Blockquote,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  NumberFormatter,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ChevronDown, Info, SquareArrowOutUpRight } from 'lucide-react';

const calculateLocalStorageUsage = () => {
  let total = 0;
  Object.keys(localStorage).forEach((key) => {
    total += localStorage[key].length + key.length;
  });
  return total / (1024 * 1024);
};

export const StorageUsageSection = () => {
  const storageLimit = 5;
  const [storageUsage, setStorageUsage] = useState(0);
  const [manageOpen, { toggle: toggleManage }] = useDisclosure(false);
  const manageId = useId();
  const [confirmClear, { open: openConfirmClear, close: closeConfirmClear }] =
    useDisclosure(false);

  const usagePercentage = (storageUsage / storageLimit) * 100;

  useEffect(() => {
    setStorageUsage(calculateLocalStorageUsage());
  }, []);

  const clearStorage = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        LocalStorage Usage
      </Text>
      <Text size="xs">
        Saved templates data and settings data are stored in LocalStorage.
      </Text>
      <Progress
        value={usagePercentage}
        size="xl"
        color={
          usagePercentage > 90
            ? 'red'
            : usagePercentage > 70
              ? 'yellow'
              : 'blue'
        }
        mx={32}
      />
      <Text size="xs" px={2} mx={32}>
        <NumberFormatter
          thousandSeparator
          value={storageUsage}
          decimalScale={2}
          fixedDecimalScale
          suffix="MB"
        />
        {' / '}
        <NumberFormatter
          thousandSeparator
          value={storageLimit}
          decimalScale={2}
          fixedDecimalScale
          suffix="MB"
        />{' '}
        <NumberFormatter
          thousandSeparator
          value={usagePercentage}
          decimalScale={1}
          fixedDecimalScale
          prefix=" ("
          suffix="%)"
        />{' '}
        used
      </Text>
      <Blockquote
        color="blue"
        icon={<Info size={14} />}
        iconSize={30}
        py={8}
        mx={8}
      >
        <Text size="xs">
          Data entered in the Data Editor and Template Editor is stored in
          SessionStorage and retained until the tab is closed.
        </Text>
        <Anchor
          href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API"
          target="_blank"
          size="xs"
        >
          <Flex align="center" gap={4}>
            Learn more about SessionStorage and LocalStorage
            <SquareArrowOutUpRight size={12} />
          </Flex>
        </Anchor>
      </Blockquote>
      <Stack gap={4} align="flex-start">
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          px={4}
          aria-expanded={manageOpen}
          aria-controls={manageId}
          onClick={toggleManage}
          rightSection={
            <ChevronDown
              size={12}
              aria-hidden="true"
              style={{ transform: manageOpen ? 'rotate(180deg)' : undefined }}
            />
          }
        >
          Manage local storage
        </Button>
        <Box id={manageId} hidden={!manageOpen}>
          <Stack gap={6} align="flex-start">
            <Text size="xs" c="dimmed">
              Delete saved templates, history, and settings from this browser. A
              confirmation dialog opens before anything is deleted.
            </Text>
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={openConfirmClear}
            >
              Clear local storage
            </Button>
          </Stack>
        </Box>
      </Stack>
      <Modal
        opened={confirmClear}
        onClose={closeConfirmClear}
        title="Clear local storage?"
        size="sm"
        centered
      >
        <Text size="sm">
          This deletes all local storage for this site, including saved
          templates, history, and settings. This cannot be undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeConfirmClear} data-autofocus>
            Cancel
          </Button>
          <Button color="red" onClick={clearStorage}>
            Clear local storage
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};
