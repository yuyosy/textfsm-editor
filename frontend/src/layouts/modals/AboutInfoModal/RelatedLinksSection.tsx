import { Anchor, Card, Flex, Stack, Table, Text } from '@mantine/core';
import { SquareArrowOutUpRight } from 'lucide-react';

export const RelatedLinksSection = () => {
  return (
    <>
      <Stack gap={4}>
        <Text fw={500}>Related links</Text>
        <Text c="dimmed" size="xs">
          Contributions are welcome! Please feel free to submit a Pull Request.
        </Text>
      </Stack>
      <Card radius="md" p={2} withBorder>
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th fw="normal" w={160}>
                Source code
              </Table.Th>
              <Table.Td>
                <Anchor
                  href="https://github.com/yuyosy/textfsm-editor/"
                  target="_blank"
                  fz={14}
                >
                  <Flex align="center" gap="sm">
                    GitHub
                    <SquareArrowOutUpRight size={16} />
                  </Flex>
                </Anchor>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th fw="normal" w={160}>
                Releases
              </Table.Th>
              <Table.Td>
                <Anchor
                  href="https://github.com/yuyosy/textfsm-editor/releases"
                  target="_blank"
                  fz={14}
                >
                  <Flex align="center" gap="sm">
                    GitHub Releases
                    <SquareArrowOutUpRight size={16} />
                  </Flex>
                </Anchor>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>
    </>
  );
};
