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
  pyodidePreloadEnabledAtom,
  savedPresetSearchInputsAtom,
} from '@/features/state/storageAtoms';
import { primaryMode } from '@/features/textfsm/parserSelection';
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
  const [preloadPyodide, setPreloadPyodide] = useAtom(
    pyodidePreloadEnabledAtom,
  );

  return (
    <Modal.Content
      h="min(44rem, calc(100dvh - 2rem))"
      styles={{ content: { display: 'flex', flexDirection: 'column' } }}
    >
      <Modal.Header style={{ flexShrink: 0 }}>
        <Modal.Title fz={18} fw={700}>
          Options
        </Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body
        display="flex"
        flex={1}
        mih={0}
        style={{ flexDirection: 'column' }}
      >
        <Stack ref={focusRef} flex={1} mih={0}>
          <Tabs
            variant="outline"
            defaultValue="editor"
            display="flex"
            flex={1}
            mih={0}
            style={{ flexDirection: 'column' }}
          >
            <Tabs.List style={{ flexShrink: 0 }}>
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
            <ScrollArea
              flex={1}
              mih={0}
              px={8}
              py={12}
              type="auto"
              scrollbars="y"
              offsetScrollbars="y"
            >
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
                <Stack gap="md">
                  {primaryMode === 'pyodide' && (
                    <>
                      <Switch
                        label="Preload Pyodide"
                        description="Download the runtime and Python TextFSM in advance when Pyodide is selected."
                        checked={preloadPyodide}
                        onChange={(event) =>
                          setPreloadPyodide(event.currentTarget.checked)
                        }
                      />
                      <Divider />
                    </>
                  )}
                  <StorageUsageSection />
                </Stack>
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </Stack>
        <Group justify="space-between" mt="lg" style={{ flexShrink: 0 }}>
          <Button variant="default" size="xs" onClick={close}>
            Close
          </Button>
        </Group>
      </Modal.Body>
    </Modal.Content>
  );
};
