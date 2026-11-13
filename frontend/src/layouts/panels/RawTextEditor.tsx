import { useCallback } from 'react';

import { useMantineColorScheme } from '@mantine/core';
import { useAtom } from 'jotai';

import { Editor } from '@/features/editor/Editor';
import { rawTextEditorValueAtom } from '@/features/state/storageAtoms';

import type { OnChange } from '@monaco-editor/react';

export const RawTextEditor = () => {
  const { colorScheme } = useMantineColorScheme();
  const [value, setValue] = useAtom(rawTextEditorValueAtom);

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
      defaultLanguage="plain"
      theme={colorScheme === 'dark' ? 'theme-dark' : 'theme-light'}
      value={value}
      onChange={handleChange}
    />
  );
};
