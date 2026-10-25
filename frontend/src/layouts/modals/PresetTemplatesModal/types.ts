import type { NtcTemplateManifestEntryV1 } from '@/features/templates/manifest';

export type MatchType = 'all' | 'regex' | 'fuzzy';

export type NtcTemplateInfo = NtcTemplateManifestEntryV1;

export interface SearchedTemplateInfo extends NtcTemplateInfo {
  matchType: MatchType;
}

export interface PlatformTemplatesDict {
  [platform: string]: NtcTemplateInfo[];
}

export interface SearchParams {
  template: string;
  platform: string;
  command: string;
}
