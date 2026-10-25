import { Panel, type PanelImperativeHandle } from 'react-resizable-panels';

import { Group, Stack, Text } from '@mantine/core';
import { useAtomValue } from 'jotai';

import { CopyValueButton } from '@/components/CopyValueButton';
import { FileDownloadButton } from '@/components/FileDownloadButton';
import { editorDataText } from '@/features/fileNames';
import { rawTextEditorValueAtom } from '@/features/state/storageAtoms';
import { getCurrentDateTimeString } from '@/utils/datetime';
import { RawTextEditor } from './RawTextEditor';

import type { RefObject } from 'react';

const DownloadButton = () => {
  const value = useAtomValue(rawTextEditorValueAtom);
  return (
    <FileDownloadButton
      content={value}
      filename={getCurrentDateTimeString(editorDataText)}
    />
  );
};

const CopyButton = () => {
  const value = useAtomValue(rawTextEditorValueAtom);
  return <CopyValueButton value={value} />;
};

interface RawTextEditorPanelProps {
  panelRef: RefObject<PanelImperativeHandle | null>;
  onResizeHandler: () => void;
}

export const RawTextEditorPanel = ({
  panelRef,
  onResizeHandler,
}: RawTextEditorPanelProps) => {
  return (
    <Panel
      id="data-panel"
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
          <Text fw={700}>Data</Text>
          <Group>
            <DownloadButton />
            <CopyButton />
          </Group>
        </Group>
        <RawTextEditor />
      </Stack>
    </Panel>
  );
};
