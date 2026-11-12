import { createPrimaryEngine, primaryMode } from '@primary-parser';

import { createTextFsmParseRunner, textFsmParseRunner } from './parseRunner';

import type {
  TextFsmEngine,
  TextFsmParseOptions,
  TextFsmParserMode,
} from './types';

export { primaryMode };

const primaryEngine: TextFsmEngine = createPrimaryEngine();
const primaryRunner = createTextFsmParseRunner(primaryEngine);
let preloadController: AbortController | undefined;

export const preloadPrimaryParser = (
  onInitializationChange: TextFsmParseOptions['onInitializationChange'],
) => {
  if (preloadController || !primaryEngine.preload) return;
  const controller = new AbortController();
  preloadController = controller;
  void primaryEngine
    .preload({ signal: controller.signal, onInitializationChange })
    .catch(() => {
      // Initialization failures are reported through the progress callback.
    })
    .finally(() => {
      if (preloadController === controller) preloadController = undefined;
    });
};

export const cancelPrimaryPreload = () => {
  const controller = preloadController;
  preloadController = undefined;
  controller?.abort();
};

export const getParseRunner = (mode: TextFsmParserMode) =>
  mode === primaryMode ? primaryRunner : textFsmParseRunner;

export const cancelParsing = () => {
  textFsmParseRunner.invalidateActive();
  primaryRunner.invalidateActive();
  cancelPrimaryPreload();
};
