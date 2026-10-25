import { loader } from '@monaco-editor/react';

import { getCompletionItemProviderSuggestions } from '@/features/editor/definitions/CompletionItemProvider';
import { languageConfiguration } from '@/features/editor/definitions/LanguageConfiguration';
import { monarchTokensProvider } from '@/features/editor/definitions/MonarchTokensProvider';
import { textfsmThemeDark as themeDark } from '@/features/editor/themes/ThemeDark';
import { textfsmThemeLight as themeLight } from '@/features/editor/themes/ThemeLight';

import type * as primitiveMonaco from 'monaco-editor';

export const initializeTextFSMEditor = () => {
  loader.init().then((monaco) => {
    monaco.editor.defineTheme('theme-dark', themeDark);
    monaco.editor.defineTheme('theme-light', themeLight);

    const languageId = 'textfsm';
    if (
      !monaco.languages
        .getLanguages()
        .some(
          (lang: primitiveMonaco.languages.ILanguageExtensionPoint) =>
            lang.id === languageId,
        )
    ) {
      monaco.languages.register({ id: languageId });
      monaco.languages.setLanguageConfiguration(
        languageId,
        languageConfiguration,
      );
      monaco.languages.setMonarchTokensProvider(
        languageId,
        monarchTokensProvider,
      );
      monaco.languages.registerCompletionItemProvider(languageId, {
        provideCompletionItems: (
          model: primitiveMonaco.editor.ITextModel,
          position: primitiveMonaco.Position,
        ) => {
          return {
            suggestions: getCompletionItemProviderSuggestions(model, position),
          };
        },
      });
    }
  });
};
