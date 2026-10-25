import type * as monaco from 'monaco-editor';
export const textfsmThemeDark: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'value-definition', foreground: '4e79aa' },
    { token: 'regex', foreground: 'bb7f33' },
    { token: 'value-option', foreground: 'f74b4b', fontStyle: 'italic' },
    { token: 'state', foreground: 'bb33b9', fontStyle: 'bold' },
    { token: 'arrow', foreground: '707372' },
    { token: 'variable-brackets', foreground: '139c82' },
    { token: 'variable', foreground: '139c82' },
    { token: 'line-action', foreground: '0a9b1a' },
    { token: 'record-action', foreground: 'c87131' },
    { token: 'transition', foreground: '7f41b3' },
    { token: 'comment', foreground: '9f9490', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#1a1b1e',
  },
};
