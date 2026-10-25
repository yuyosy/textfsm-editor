import { envs } from '@/config/env';
import { createBackendTextFsmEngine } from './backendEngine';
import { createTextFsmParseRunner, textFsmParseRunner } from './parseRunner';

import type { TextFsmParserMode } from './types';

const backendRunner = createTextFsmParseRunner(
  createBackendTextFsmEngine({ apiBaseUrl: envs.API_ENTRYPOINT }),
);

export const getParseRunner = (mode: TextFsmParserMode) =>
  mode === 'backend' ? backendRunner : textFsmParseRunner;

export const cancelParsing = () => {
  textFsmParseRunner.invalidateActive();
  backendRunner.invalidateActive();
};
