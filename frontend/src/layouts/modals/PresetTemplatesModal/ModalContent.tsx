import { useEffect, useMemo, useState } from 'react';

import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import Fuse from 'fuse.js';

import { useFetchTemplates } from './hooks/useFetchTemplates';
import { useLoadPresetTemplate } from './hooks/useLoadPresetTemplate';
import { SearchForm } from './SearchForm';
import { TemplateTable } from './TemplateTable';
import { getFuzzyFilteredTemplates, getRegexFilteredTemplates } from './utils';

import type { ModalContentProps } from '../types';
import type { SearchedTemplateInfo, SearchParams } from './types';

export const PresetTemplatesModalContent = ({
  close,
  focusRef,
}: ModalContentProps) => {
  const { templates, loading, error, refetch } = useFetchTemplates();
  const { loadTemplate } = useLoadPresetTemplate();
  const [selectedRecords, setSelectedRecords] = useState<
    SearchedTemplateInfo[]
  >([]);
  const [isAndCondition, setIsAndCondition] = useState(true);
  const [isFuzzyEnabled, setIsFuzzyEnabled] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<SearchedTemplateInfo | null>(null);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    template: '',
    platform: '',
    command: '',
  });

  const handleSearchParamsChange = (
    field: keyof SearchParams,
    value: string,
  ) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlatformChange = (platform: string | null) => {
    setSelectedPlatform(platform);
  };

  const handleAndConditionChange = (value: boolean) => {
    setIsAndCondition(value);
  };

  const handleFuzzyEnabledChange = (value: boolean) => {
    setIsFuzzyEnabled(value);
  };

  const fuse = useMemo(
    () =>
      new Fuse(Object.values(templates).flat(), {
        keys: ['template'],
        threshold: 0.6,
      }),
    [templates],
  );

  const regexFilteredTemplates = useMemo(() => {
    return getRegexFilteredTemplates(
      templates,
      searchParams,
      isAndCondition,
      selectedPlatform,
    );
  }, [templates, searchParams, isAndCondition, selectedPlatform]);

  const fuzzyFilteredTemplates = useMemo(() => {
    if (!isFuzzyEnabled) {
      return [];
    }
    return getFuzzyFilteredTemplates(
      fuse,
      searchParams.command,
      regexFilteredTemplates,
      selectedPlatform,
    );
  }, [
    fuse,
    searchParams.command,
    regexFilteredTemplates,
    selectedPlatform,
    isFuzzyEnabled,
  ]);

  useEffect(() => {
    const combinedTemplates: SearchedTemplateInfo[] = [
      ...regexFilteredTemplates,
      ...fuzzyFilteredTemplates,
    ];
    if (combinedTemplates.length > 0) {
      setSelectedRecords(combinedTemplates);
    } else {
      setSelectedRecords([]);
    }
  }, [regexFilteredTemplates, fuzzyFilteredTemplates]);

  const handleSelectTemplate = (template: SearchedTemplateInfo) => {
    setSelectedTemplate(template);
  };

  const handleLoadTemplate = async () => {
    if (selectedTemplate === null) {
      return;
    }

    await loadTemplate(selectedTemplate);
    close();
  };

  return (
    <Modal.Content>
      <Modal.Header>
        <Modal.Title fz={18} fw={700}>
          Preset Templates
        </Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <Stack ref={focusRef} p={8}>
          <SearchForm
            templates={templates}
            searchParams={searchParams}
            isAndCondition={isAndCondition}
            isFuzzyEnabled={isFuzzyEnabled}
            selectedPlatform={selectedPlatform}
            handleSearchParamsChange={handleSearchParamsChange}
            handlePlatformChange={handlePlatformChange}
            handleAndConditionChange={handleAndConditionChange}
            handleFuzzyEnabledChange={handleFuzzyEnabledChange}
          />
          <TemplateTable
            templates={selectedRecords}
            loading={loading}
            onSelectTemplate={handleSelectTemplate}
          />
          {error === null ? null : (
            <Group justify="space-between" align="flex-start" gap="sm">
              <Text size="sm" c="red">
                Failed to load preset templates. {error.message}
              </Text>
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  void refetch();
                }}
                loading={loading}
              >
                Retry
              </Button>
            </Group>
          )}
          <TextInput
            label="Selected Template"
            value={selectedTemplate?.template ?? ''}
            readOnly
          />
        </Stack>
        <Group justify="space-between" mt="lg">
          <Button variant="default" size="xs" onClick={close}>
            Close
          </Button>
          <Button
            size="xs"
            color="cyan"
            onClick={() => {
              void handleLoadTemplate();
            }}
            disabled={selectedTemplate === null}
          >
            Load Template
          </Button>
        </Group>
      </Modal.Body>
    </Modal.Content>
  );
};
