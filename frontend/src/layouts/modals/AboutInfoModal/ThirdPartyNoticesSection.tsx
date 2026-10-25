import { Anchor, Card, Flex, Table } from '@mantine/core';
import { SquareArrowOutUpRight } from 'lucide-react';

export const ThirdPartyNoticesSection = () => {
  return (
    <Card radius="md" p={2} withBorder>
      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th fw="normal" w={160}>
              Licenses
            </Table.Th>
            <Table.Td>
              <Anchor
                href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.txt`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                <Flex align="center" gap="xs">
                  Open-source licenses
                  <SquareArrowOutUpRight size={16} />
                </Flex>
              </Anchor>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Card>
  );
};
