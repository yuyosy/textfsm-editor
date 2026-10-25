import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { localStorage, sessionStorage } from './syncStorage';

import type { TextFsmParserMode } from '@/features/textfsm/types';
import type {
  PlatformPriority,
  TemplateInfo,
  TemplateTag,
} from '@/layouts/modals/types';
import type { HistoryAutoSaveItem } from '@/types';

const storedParserModeAtom = atomWithStorage<TextFsmParserMode>(
  'options-parser-mode',
  'local',
  localStorage(),
  { getOnInit: true },
);
export const parserModeAtom = atom(
  (get): TextFsmParserMode =>
    get(storedParserModeAtom) === 'backend' ? 'backend' : 'local',
  (_get, set, mode: TextFsmParserMode) => set(storedParserModeAtom, mode),
);

export const savedTemplateListAtom = atomWithStorage<TemplateInfo[]>(
  'editor-template-list',
  [],
  localStorage(),
  {
    getOnInit: true,
  },
);

export const parseRequestDelayAtom = atomWithStorage<number>(
  'options-editor-parse-request-delay',
  1000,
  localStorage(),
  {
    getOnInit: true,
  },
);

export const autoRequestEnabledAtom = atomWithStorage<boolean>(
  'options-editor-auto-request-enabled',
  false,
  localStorage(),
  {
    getOnInit: true,
  },
);

export const platformPrioritiesAtom = atomWithStorage<PlatformPriority[]>(
  'options-platform-priorities',
  [],
  localStorage(),
  {
    getOnInit: true,
  },
);

export const rawTextEditorValueAtom = atomWithStorage<string>(
  'data-editor-value',
  '// Type your data here',
  sessionStorage(),
  {
    getOnInit: true,
  },
);

export const templateEditorValueAtom = atomWithStorage<string>(
  'template-editor-value',
  '# Type your template here',
  sessionStorage(),
  {
    getOnInit: true,
  },
);

export const templateTagsAtom = atomWithStorage<TemplateTag[]>(
  'options-template-tags',
  [],
  localStorage(),
  {
    getOnInit: true,
  },
);

export const historyAutoSaveEnabledAtom = atomWithStorage<boolean>(
  'options-history-auto-save-enabled',
  true,
  localStorage(),
  { getOnInit: true },
);

export const historyAutoSaveCountAtom = atomWithStorage<number>(
  'options-history-auto-save-count',
  5,
  localStorage(),
  { getOnInit: true },
);

export const historyAutoSaveItemsAtom = atomWithStorage<HistoryAutoSaveItem[]>(
  'options-history-auto-save-items',
  [],
  localStorage(),
  { getOnInit: true },
);

export const historyPageSizeAtom = atomWithStorage<number>(
  'options-history-page-size',
  10,
  localStorage(),
  { getOnInit: true },
);

// Removed history auto-save action atoms, they are extracted to historyAutoSaveActions.ts
