import { createPrimaryEngine, primaryMode } from '@primary-parser';

import { createTextFsmParseRunner, textFsmParseRunner } from './parseRunner';

import type { TextFsmParserMode } from './types';

export { primaryMode };

const primaryRunner = createTextFsmParseRunner(createPrimaryEngine());

export const getParseRunner = (mode: TextFsmParserMode) =>
  mode === primaryMode ? primaryRunner : textFsmParseRunner;

export const cancelParsing = () => {
  textFsmParseRunner.invalidateActive();
  primaryRunner.invalidateActive();
};
