import { memo } from 'react';

import {
  Editor as MonacoEditor,
  type EditorProps as MonacoEditorProps,
  type OnChange,
} from '@monaco-editor/react';

const monacoOptions: MonacoEditorProps['options'] = {
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    verticalScrollbarSize: 10,
  },
  minimap: { enabled: true },
  tabSize: 2,
  mouseWheelZoom: true,
  fontSize: 13,
  renderValidationDecorations: 'off',
};

export const Editor: React.FC<{
  defaultLanguage: string;
  theme: string;
  value: string;
  onChange: OnChange;
}> = memo(({ defaultLanguage, theme, value, onChange }) => {
  return (
    <MonacoEditor
      height="100%"
      defaultLanguage={defaultLanguage}
      theme={theme}
      value={value}
      onChange={onChange}
      options={monacoOptions}
    />
  );
});
