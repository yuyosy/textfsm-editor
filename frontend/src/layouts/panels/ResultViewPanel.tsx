import { type RefObject, useMemo } from 'react';
import { Panel, type PanelImperativeHandle } from 'react-resizable-panels';

import { CodeHighlight } from '@mantine/code-highlight';
import { Box, Group, ScrollArea, Stack, Tabs, Text } from '@mantine/core';
import { useAtomValue } from 'jotai';
import { Braces, Table } from 'lucide-react';
import { DataTable } from 'mantine-datatable';

import { CopyValueButton } from '@/components/CopyValueButton';
import { FileDownloadButton } from '@/components/FileDownloadButton';
import { resultJSON, resultTSV } from '@/features/fileNames';
import { resultViewValueAtom } from '@/features/state/atoms';
import { useDataDeliver } from '@/hooks/useDataDeliver';
import { getCurrentDateTimeString } from '@/utils/datetime';

interface ResultViewPanelProps {
  panelRef: RefObject<PanelImperativeHandle | null>;
  onResizeHandler: () => void;
}
export const ResultViewPanel = ({
  panelRef,
  onResizeHandler,
}: ResultViewPanelProps) => {
  const resultViewValue = useAtomValue(resultViewValueAtom);

  const header = resultViewValue?.data?.header || [];
  const results = resultViewValue?.data?.results || [];

  const { tsvDataDeliver, jsonDataDeliver } = useDataDeliver({
    header,
    results,
  });

  // パフォーマンス最適化: テーブルデータをメモ化
  const tableRecords = useMemo(
    () =>
      results.map((item, index) => {
        const entries = Object.entries(item).map(([key, val]) => [
          key,
          Array.isArray(val) ? val.join(', ') : val,
        ]);
        entries.push(['$index', String(index)]);
        return Object.fromEntries(entries);
      }),
    [results],
  );

  // パフォーマンス最適化: カラム定義をメモ化
  const tableColumns = useMemo(
    () => header.map((value) => ({ accessor: value })),
    [header],
  );

  return (
    <Panel
      id="result-panel"
      defaultSize="50"
      collapsedSize="0"
      minSize="10"
      collapsible={true}
      panelRef={panelRef}
      onResize={onResizeHandler}
      style={{ overflow: 'hidden' }}
    >
      <Tabs
        variant="pills"
        radius={0}
        defaultValue="table"
        orientation="vertical"
        h="100%"
      >
        <Tabs.List>
          <Tabs.Tab value="table" leftSection={<Table size="0.8rem" />}>
            Table
          </Tabs.Tab>
          <Tabs.Tab value="json" leftSection={<Braces size="0.8rem" />}>
            JSON
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="table" h="100%">
          <Stack gap={0} h="100%" style={{ overflow: 'hidden' }}>
            <Group
              px={10}
              py={4}
              justify="space-between"
              style={{ flexShrink: 0 }}
            >
              <Text fw={700}>Table View</Text>
              <Group>
                <FileDownloadButton
                  content={tsvDataDeliver()}
                  filename={getCurrentDateTimeString(resultTSV)}
                />
                <CopyValueButton value={tsvDataDeliver()} />
              </Group>
            </Group>
            <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <Box style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
                <DataTable
                  columns={tableColumns}
                  records={tableRecords}
                  idAccessor="$index"
                  striped
                  withTableBorder
                  withColumnBorders
                  scrollAreaProps={{
                    type: 'never',
                  }}
                  styles={{
                    table: {
                      minWidth: 'max-content',
                    },
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="json" h="100%">
          <Stack gap={0} h="100%" style={{ overflow: 'hidden' }}>
            <Group
              px={10}
              py={4}
              justify="space-between"
              style={{ flexShrink: 0 }}
            >
              <Text fw={700}>JSON View</Text>
              <Group>
                <FileDownloadButton
                  content={jsonDataDeliver()}
                  filename={getCurrentDateTimeString(resultJSON)}
                />
                <CopyValueButton value={jsonDataDeliver()} />
              </Group>
            </Group>
            <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <ScrollArea
                style={{ position: 'absolute', inset: 0 }}
                type="auto"
                scrollbarSize={8}
                offsetScrollbars
              >
                <Box p={8}>
                  <CodeHighlight
                    code={jsonDataDeliver()}
                    language="json"
                    withCopyButton={false}
                  />
                </Box>
              </ScrollArea>
            </Box>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Panel>
  );
};
