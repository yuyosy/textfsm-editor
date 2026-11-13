import { useCallback } from 'react';

import { useMantineColorScheme } from '@mantine/core';
import { useAtom } from 'jotai';

import { Editor } from '@/features/editor/Editor';
import { templateEditorValueAtom } from '@/features/state/storageAtoms';

import type { OnChange } from '@monaco-editor/react';

export const TemplateEditor = () => {
  const { colorScheme } = useMantineColorScheme();
  const [value, setValue] = useAtom(templateEditorValueAtom);

  // Keep the atom current; delayed writes can overwrite newer editor content.
  const handleChange = useCallback<OnChange>(
    (value) => {
      if (value !== undefined) {
        setValue(value);
      }
    },
    [setValue],
  );

  return (
    <Editor
      defaultLanguage="textfsm"
      theme={colorScheme === 'dark' ? 'theme-dark' : 'theme-light'}
      value={value}
      onChange={handleChange}
    />
  );
};
