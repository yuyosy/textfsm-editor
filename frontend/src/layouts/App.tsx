import {
  CodeHighlightAdapterProvider,
  createShikiAdapter,
} from '@mantine/code-highlight';
import {
  ActionIcon,
  AppShell,
  colorsTuple,
  createTheme,
  MantineProvider,
  virtualColor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { initializeTextFSMEditor } from '@/features/editor/initializeEditor';
import { AppHeader } from './AppHeader';
import { AppMain } from './AppMain';
import { AppNavbar } from './AppNav';

const theme = createTheme({
  black: '#484951',
  components: {
    ActionIcon: ActionIcon.extend({
      vars: (_theme, { color, variant }) => ({
        root: {
          '--ai-color':
            color === 'gray' &&
            (variant === 'subtle' || variant === 'transparent')
              ? 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-light-color))'
              : undefined,
        },
      }),
    }),
  },
  colors: {
    'base-dark': colorsTuple('#343637'),
    'base-light': colorsTuple('#e1e4e6'),
    'base-background': virtualColor({
      name: 'base-background',
      dark: 'base-dark',
      light: 'base-light',
    }),
  },
});

const loadShiki = async () => {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
    await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ]);
  return createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [import('shiki/langs/json.mjs')],
    themes: [
      import('shiki/themes/light-plus.mjs'),
      import('shiki/themes/andromeeda.mjs'),
    ],
  });
};
const shikiAdapter = createShikiAdapter(loadShiki);

export const App = () => {
  // refer to : https://mantine.dev/guides/dark-theme/#save-to-localstorage-and-add-keyboard-shortcut
  // const [colorScheme, setColorScheme] = useLocalStorage<MantineColorScheme>({
  //   key: 'mantine-color-scheme',
  //   defaultValue: 'light',
  //   getInitialValueInEffect: true,
  // });

  initializeTextFSMEditor();
  const [opened, { toggle }] = useDisclosure();
  const navbarWidth = opened ? 300 : 60;

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <CodeHighlightAdapterProvider adapter={shikiAdapter}>
        <AppShell
          layout="alt"
          withBorder={false}
          navbar={{
            width: navbarWidth,
            breakpoint: 'sm',
            collapsed: { mobile: !opened },
          }}
          bg="base-background"
        >
          <AppHeader opened={opened} toggle={toggle} />
          <AppNavbar opened={opened} toggle={toggle} />
          <AppMain />
          {/* <AppFooter /> */}
        </AppShell>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
};
