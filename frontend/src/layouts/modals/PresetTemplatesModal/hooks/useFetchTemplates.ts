import { useCallback, useEffect, useState } from 'react';

import {
  type StaticTemplateRepository,
  staticTemplateRepository,
} from '@/features/templates/staticTemplateRepository';

import type { NtcTemplateInfo, PlatformTemplatesDict } from '../types';

export function groupTemplatesByPlatform(
  templates: ReadonlyArray<NtcTemplateInfo>,
): PlatformTemplatesDict {
  return templates.reduce((groupedTemplates, template) => {
    const platformTemplates = groupedTemplates[template.platform] ?? [];
    groupedTemplates[template.platform] = [...platformTemplates, template];
    return groupedTemplates;
  }, {} as PlatformTemplatesDict);
}

export const useFetchTemplates = (
  repository: StaticTemplateRepository = staticTemplateRepository,
) => {
  const [templates, setTemplates] = useState<PlatformTemplatesDict>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const manifestEntries = await repository.list();
      setTemplates(groupTemplatesByPlatform(manifestEntries));
    } catch (caughtError) {
      const resolvedError =
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to fetch templates.');
      console.error('Failed to fetch templates:', resolvedError);
      setTemplates({});
      setError(resolvedError);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { templates, loading, error, refetch };
};
