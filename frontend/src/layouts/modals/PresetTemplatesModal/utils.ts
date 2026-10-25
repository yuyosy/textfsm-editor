import { regexTest } from '@/utils/regexTest';

import type Fuse from 'fuse.js';
import type {
  NtcTemplateInfo,
  PlatformTemplatesDict,
  SearchedTemplateInfo,
  SearchParams,
} from './types';

// Function to filter templates based on regex and search parameters
export const getRegexFilteredTemplates = (
  templates: PlatformTemplatesDict,
  searchParams: SearchParams,
  isAndCondition: boolean,
  selectedPlatform: string | null,
): SearchedTemplateInfo[] => {
  if (selectedPlatform === null) {
    return [];
  }
  return Object.values(templates[selectedPlatform] || [])
    .filter(({ template, commandRaw, commandRegex }) => {
      const conditions: boolean[] = [];
      if (searchParams.template !== '') {
        conditions.push(
          template
            .toLowerCase()
            .includes(searchParams.template.trim().toLowerCase()),
        );
      }
      if (searchParams.command !== '') {
        conditions.push(
          commandRaw
            .toLowerCase()
            .includes(searchParams.command.trim().toLowerCase()) ||
            regexTest(commandRegex, searchParams.command),
        );
      }

      return isAndCondition
        ? conditions.every((value) => value === true)
        : conditions.some((value) => value === true);
    })
    .map((item) => ({
      ...item,
      matchType: searchParams.command === '' ? 'all' : 'regex',
    }));
};

// Function to filter templates based on fuzzy search
export const getFuzzyFilteredTemplates = (
  fuse: Fuse<NtcTemplateInfo>,
  searchValue: string,
  regexFilteredTemplates: SearchedTemplateInfo[],
  selectedPlatform: string | null,
): SearchedTemplateInfo[] => {
  return fuse
    .search(searchValue)
    .map((result) => result.item)
    .filter(
      (item) =>
        item.platform === selectedPlatform &&
        !regexFilteredTemplates.some(
          (regexItem) =>
            regexItem.template === item.template &&
            regexItem.commandRaw === item.commandRaw,
        ),
    )
    .map((item) => ({ ...item, matchType: 'fuzzy' }));
};
