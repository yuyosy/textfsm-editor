import { envs } from '@/config/env';
import { createBackendTextFsmEngine } from './backendEngine';

import type { TextFsmParserMode } from './types';

export const primaryMode: Exclude<TextFsmParserMode, 'local'> = 'backend';
export const createPrimaryEngine = () =>
  createBackendTextFsmEngine({ apiBaseUrl: envs.API_ENTRYPOINT });
