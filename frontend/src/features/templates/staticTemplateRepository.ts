import {
  type NtcTemplateManifestEntryV1,
  type ParsedNtcTemplateManifestV1,
  parseNtcTemplateManifest,
  serializeManifestEntryIdentity,
} from './manifest';

const TEMPLATE_BYTES_LIMIT = 1024 * 1024;

type RepositoryManifest = {
  entryIdentities: ReadonlySet<string>;
  entries: ReadonlyArray<Readonly<NtcTemplateManifestEntryV1>>;
};

export type StaticTemplateRepository = {
  list(): Promise<RepositoryManifest['entries']>;
  load(template: NtcTemplateManifestEntryV1): Promise<string>;
};

type CreateStaticTemplateRepositoryOptions = {
  baseUrl?: string;
  crypto?: Pick<Crypto, 'subtle'>;
  documentBaseURI?: string;
  fetch?: typeof fetch;
};

function getDocumentUrl(documentBaseURI?: string) {
  const resolvedDocumentBaseURI =
    documentBaseURI ?? globalThis.document?.baseURI;

  if (
    typeof resolvedDocumentBaseURI !== 'string' ||
    resolvedDocumentBaseURI.length === 0
  ) {
    throw new Error(
      'document.baseURI must be available to resolve static templates.',
    );
  }

  return new URL(resolvedDocumentBaseURI);
}

function assertSameOrigin(url: URL, documentUrl: URL) {
  if (url.origin !== documentUrl.origin) {
    throw new Error(
      'Resolved static template URL must stay on the same origin.',
    );
  }
}

function parseContentLength(headerValue: string | null) {
  if (headerValue === null || !/^(0|[1-9]\d*)$/u.test(headerValue)) {
    return null;
  }

  const contentLength = Number.parseInt(headerValue, 10);
  return Number.isSafeInteger(contentLength) ? contentLength : null;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}

async function readTemplateBytes(response: Response) {
  const contentLength = parseContentLength(
    response.headers.get('content-length'),
  );
  if (contentLength !== null && contentLength > TEMPLATE_BYTES_LIMIT) {
    throw new Error(`Template exceeds the ${TEMPLATE_BYTES_LIMIT}-byte limit.`);
  }

  if (response.body === null) {
    const bodyBytes = new Uint8Array(await response.arrayBuffer());
    if (bodyBytes.byteLength > TEMPLATE_BYTES_LIMIT) {
      throw new Error(
        `Template exceeds the ${TEMPLATE_BYTES_LIMIT}-byte limit.`,
      );
    }
    return bodyBytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > TEMPLATE_BYTES_LIMIT) {
      try {
        await reader.cancel('Template exceeds size limit.');
      } finally {
        reader.releaseLock();
        await response.body.cancel('Template exceeds size limit.');
      }
      throw new Error(
        `Template exceeds the ${TEMPLATE_BYTES_LIMIT}-byte limit.`,
      );
    }

    chunks.push(value);
  }

  reader.releaseLock();

  const mergedBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    mergedBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return mergedBytes;
}

async function fetchJson(fetchImpl: typeof fetch, url: string) {
  const response = await fetchImpl(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Manifest request failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function fetchTemplateText(
  fetchImpl: typeof fetch,
  cryptoImpl: Pick<Crypto, 'subtle'>,
  url: string,
  expectedSha256: string,
  templatePath: string,
) {
  const response = await fetchImpl(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Template request failed with HTTP ${response.status}.`);
  }

  const templateBytes = await readTemplateBytes(response);
  const actualSha256 = bytesToHex(
    await cryptoImpl.subtle.digest('SHA-256', templateBytes),
  );

  if (actualSha256 !== expectedSha256) {
    throw new Error(`Template SHA-256 mismatch for ${templatePath}.`);
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(templateBytes);
}

function buildRepositoryManifest(
  manifest: ParsedNtcTemplateManifestV1,
): RepositoryManifest {
  return {
    entries: manifest.entries,
    entryIdentities: new Set(
      manifest.entries.map(serializeManifestEntryIdentity),
    ),
  };
}

export function createStaticTemplateRepository(
  options: CreateStaticTemplateRepositoryOptions = {},
): StaticTemplateRepository {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const cryptoImpl = options.crypto ?? globalThis.crypto;

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch must be available to load static templates.');
  }

  if (
    cryptoImpl === undefined ||
    cryptoImpl.subtle === undefined ||
    typeof cryptoImpl.subtle.digest !== 'function'
  ) {
    throw new Error(
      'crypto.subtle.digest must be available to verify templates.',
    );
  }

  const documentUrl = getDocumentUrl(options.documentBaseURI);
  const appBaseUrl = new URL(
    options.baseUrl ?? import.meta.env.BASE_URL,
    documentUrl,
  );
  assertSameOrigin(appBaseUrl, documentUrl);

  const templatesRootUrl = new URL('ntc-templates/', appBaseUrl);
  assertSameOrigin(templatesRootUrl, documentUrl);

  const manifestUrl = new URL('manifest.json', templatesRootUrl);
  assertSameOrigin(manifestUrl, documentUrl);

  let manifestPromise: Promise<RepositoryManifest> | null = null;
  const templatePromises = new Map<string, Promise<string>>();

  const loadManifest = async () => {
    if (manifestPromise === null) {
      manifestPromise = fetchJson(fetchImpl, manifestUrl.toString())
        .then(parseNtcTemplateManifest)
        .then(buildRepositoryManifest)
        .catch((error) => {
          manifestPromise = null;
          throw error;
        });
    }

    return manifestPromise;
  };

  return {
    async list() {
      return (await loadManifest()).entries;
    },
    async load(template) {
      const manifest = await loadManifest();
      const identity = serializeManifestEntryIdentity(template);

      if (!manifest.entryIdentities.has(identity)) {
        throw new Error('Template entry is not present in the manifest.');
      }

      const cacheKey = `${template.path}\u0000${template.sha256}`;
      const cachedPromise = templatePromises.get(cacheKey);
      if (cachedPromise !== undefined) {
        return cachedPromise;
      }

      const templateUrl = new URL(template.path, templatesRootUrl);
      assertSameOrigin(templateUrl, documentUrl);

      const templatePromise = fetchTemplateText(
        fetchImpl,
        cryptoImpl,
        templateUrl.toString(),
        template.sha256,
        template.path,
      ).catch((error) => {
        templatePromises.delete(cacheKey);
        throw error;
      });

      templatePromises.set(cacheKey, templatePromise);
      return templatePromise;
    },
  };
}

export const staticTemplateRepository = createStaticTemplateRepository();
