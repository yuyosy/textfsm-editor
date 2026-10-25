import { useSetAtom } from 'jotai';

import { addNotificationAtom } from '@/features/state/atoms';
import { templateEditorValueAtom } from '@/features/state/storageAtoms';
import {
  type StaticTemplateRepository,
  staticTemplateRepository,
} from '@/features/templates/staticTemplateRepository';

import type { NtcTemplateInfo } from '../types';

export const useLoadPresetTemplate = (
  repository: StaticTemplateRepository = staticTemplateRepository,
) => {
  const addNotification = useSetAtom(addNotificationAtom);
  const setEditorContent = useSetAtom(templateEditorValueAtom);

  const loadTemplate = async (template: NtcTemplateInfo) => {
    try {
      const templateContent = await repository.load(template);
      setEditorContent(templateContent);
      addNotification({
        type: 'success',
        title: 'Preset template loaded',
        message: `Loaded: ${template.template}`,
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load preset template',
        message: `Failed to load: ${template.template}`,
      });
    }
  };

  return { loadTemplate };
};
