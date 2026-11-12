import {
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Switch,
  Tabs,
} from '@mantine/core';
import { useAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import {
  FileClock,
  Package,
  PencilLine,
  PencilRuler,
  Tags,
} from 'lucide-react';

import {
  emptyPresetSearchInputs,
  savedPresetSearchInputsAtom,
} from '@/features/state/storageAtoms';
import { HistoryAutoSaveSection } from './HistoryAutoSaveSection';
import { ParseDelaySection } from './ParseDelaySection';
import { PlatformPrioritySection } from './PlatformPrioritySection';
import { StorageUsageSection } from './StorageUsageSection';
import { TemplateTagSection } from './TemplateTagSection';

import type { ModalContentProps } from '../types';

export const OptionsModalContent = ({ focusRef, close }: ModalContentProps) => {
  const [savedPresetSearch, setSavedPresetSearch] = useAtom(
    savedPresetSearchInputsAtom,
  );

  return (
    <Modal.Content>
      <Modal.Header>
        <Modal.Title fz={18} fw={700}>
          Options
        </Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <Stack ref={focusRef}>
          <Tabs variant="outline" defaultValue="editor">
            <Tabs.List>
              <Tabs.Tab
                value="editor"
                p={8}
                leftSection={<PencilLine size={20} strokeWidth={1.5} />}
              >
                Editor
              </Tabs.Tab>
              <Tabs.Tab
                value="tags"
                p={8}
                leftSection={<Tags size={20} strokeWidth={1.5} />}
              >
                Tags
              </Tabs.Tab>
              <Tabs.Tab
                value="presets"
                p={8}
                leftSection={<Package size={20} strokeWidth={1.5} />}
              >
                Presets
              </Tabs.Tab>
              <Tabs.Tab
                value="history"
                p={8}
                leftSection={<FileClock size={20} strokeWidth={1.5} />}
              >
                History
              </Tabs.Tab>
              <Tabs.Tab
                value="general"
                p={8}
                leftSection={<PencilRuler size={20} strokeWidth={1.5} />}
              >
                General
              </Tabs.Tab>
            </Tabs.List>
            <ScrollArea h={500} p={16} type="always" offsetScrollbars>
              <Tabs.Panel value="editor" py={8}>
                <ParseDelaySection />
              </Tabs.Panel>
              <Tabs.Panel value="tags" py={8}>
                <TemplateTagSection />
              </Tabs.Panel>
              <Tabs.Panel value="presets" py={8}>
                <Stack gap="md">
                  <Switch
                    label="Remember preset search inputs"
                    description="Keep the last platform, template name, and command in this browser. Turning this off clears the saved inputs."
                    checked={savedPresetSearch !== null}
                    onChange={(event) =>
                      setSavedPresetSearch(
                        event.currentTarget.checked
                          ? emptyPresetSearchInputs
                          : RESET,
                      )
                    }
                  />
                  <Divider />
                  <PlatformPrioritySection />
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="history" py={8}>
                <HistoryAutoSaveSection />
              </Tabs.Panel>
              <Tabs.Panel value="general" py={8}>
                <StorageUsageSection />
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </Stack>
        <Group justify="space-between" mt="lg">
          <Button variant="default" size="xs" onClick={close}>
            Close
          </Button>
        </Group>
      </Modal.Body>
    </Modal.Content>
  );
};
