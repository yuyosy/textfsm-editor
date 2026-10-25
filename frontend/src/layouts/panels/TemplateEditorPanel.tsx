import { Panel, type PanelImperativeHandle } from 'react-resizable-panels';

import { Group, Stack, Text } from '@mantine/core';
import { useAtomValue } from 'jotai';

import { CopyValueButton } from '@/components/CopyValueButton';
import { FileDownloadButton } from '@/components/FileDownloadButton';
import { StatusBadge } from '@/components/StatusBadge';
import { editorTemplateText } from '@/features/fileNames';
import { responseStateAtom } from '@/features/state/atoms';
import { templateEditorValueAtom } from '@/features/state/storageAtoms';
import { getCurrentDateTimeString } from '@/utils/datetime';
import { TemplateEditor } from './TemplateEditor';

import type { RefObject } from 'react';

const ResponseState = () => {
  const responseState = useAtomValue(responseStateAtom);
  return <StatusBadge variant={responseState} />;
};

const DownloadButton = () => {
  const value = useAtomValue(templateEditorValueAtom);
  return (
    <FileDownloadButton
      content={value}
      filename={getCurrentDateTimeString(editorTemplateText)}
    />
  );
};

const CopyButton = () => {
  const value = useAtomValue(templateEditorValueAtom);
  return <CopyValueButton value={value} />;
};

interface TemplateEditorPanelProps {
  panelRef: RefObject<PanelImperativeHandle | null>;
  onResizeHandler: () => void;
}

export const TemplateEditorPanel = ({
  panelRef,
  onResizeHandler,
}: TemplateEditorPanelProps) => {
  return (
    <Panel
      id="template-panel"
      defaultSize="50"
      collapsedSize="0"
      minSize="10"
      collapsible={true}
      panelRef={panelRef}
      onResize={onResizeHandler}
      style={{ overflow: 'hidden' }}
    >
      <Stack gap={0} h="100%">
        <Group px={10} py={8} justify="space-between">
          <Group>
            <Text fw={700}>Template</Text>
            <ResponseState />
          </Group>
          <Group>
            <DownloadButton />
            <CopyButton />
          </Group>
        </Group>
        <TemplateEditor />
      </Stack>
    </Panel>
  );
};
