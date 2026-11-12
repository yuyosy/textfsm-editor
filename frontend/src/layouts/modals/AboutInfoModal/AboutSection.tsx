import { Anchor, Card, Flex, Table, Text } from '@mantine/core';
import { SquareArrowOutUpRight } from 'lucide-react';

export const AboutSection = () => {
  return (
    <>
      <Text fw={500}>About TextFSM-Editor</Text>
      <Card radius="md" p={2} withBorder>
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th fw="normal" w={160}>
                Version
              </Table.Th>
              <Table.Td>{__APP_VERSION__}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th fw="normal">Author</Table.Th>
              <Table.Td>yuyosy</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th fw="normal">License</Table.Th>
              <Table.Td>
                <Anchor
                  href="https://github.com/yuyosy/textfsm-editor/blob/main/LICENSE"
                  target="_blank"
                  fz={14}
                >
                  <Flex align="center" gap="sm">
                    MIT License
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
