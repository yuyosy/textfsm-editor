export const NTC_TEMPLATE_MANIFEST_SCHEMA_VERSION = 1;
const SAFE_VERSION_RE = /^\d+\.\d+\.\d+$/u;

const SAFE_TEMPLATE_PATH_RE = /^templates\/[a-zA-Z0-9_.-]+\.textfsm$/u;
const SAFE_SHA256_RE = /^[0-9a-f]{64}$/u;

export type NtcTemplateManifestEntryV1 = {
  commandRaw: string;
  commandRegex: string;
  hostname: string;
  path: string;
  platform: string;
  sha256: string;
  template: string;
};

export type NtcTemplateManifestV1 = {
  entries: NtcTemplateManifestEntryV1[];
  generatedAt: string;
  schemaVersion: 1;
  version: string;
};

type FrozenManifestEntry = Readonly<NtcTemplateManifestEntryV1>;
type FrozenManifestEntries = ReadonlyArray<FrozenManifestEntry>;

export type ParsedNtcTemplateManifestV1 = Readonly<{
  entries: FrozenManifestEntries;
  generatedAt: string;
  schemaVersion: 1;
  version: string;
}>;

const MANIFEST_ENTRY_FIELDS = [
  'commandRaw',
  'commandRegex',
  'hostname',
  'path',
  'platform',
  'sha256',
  'template',
] as const;
const objectHasOwnProperty = Object.prototype.hasOwnProperty;

type ManifestEntryField = (typeof MANIFEST_ENTRY_FIELDS)[number];

function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function readOwnDataProperty(
  source: Record<PropertyKey, unknown>,
  property: string,
  label: string,
): string {
  const descriptor = Object.getOwnPropertyDescriptor(source, property);

  if (
    descriptor === undefined ||
    'get' in descriptor ||
    'set' in descriptor ||
    typeof descriptor.value !== 'string'
  ) {
    throw new Error(`${label} must be an own string data property.`);
  }

  return descriptor.value;
}

function readOwnLiteralNumberProperty(
  source: Record<PropertyKey, unknown>,
  property: string,
  value: number,
  label: string,
) {
  const descriptor = Object.getOwnPropertyDescriptor(source, property);

  if (
    descriptor === undefined ||
    'get' in descriptor ||
    'set' in descriptor ||
    descriptor.value !== value
  ) {
    throw new Error(`${label} must equal ${value}.`);
  }
}

function assertTemplatePath(path: string) {
  if (
    !SAFE_TEMPLATE_PATH_RE.test(path) ||
    path.startsWith('/') ||
    path.includes('..') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('%') ||
    path.includes('://') ||
    path.startsWith('//')
  ) {
    throw new Error(`Manifest entry path is invalid: ${path}`);
  }
}

function assertSha256(sha256: string) {
  if (!SAFE_SHA256_RE.test(sha256)) {
    throw new Error(`Manifest entry sha256 is invalid: ${sha256}`);
  }
}

export function serializeManifestEntryIdentity(
  entry: Pick<
    NtcTemplateManifestEntryV1,
    | 'commandRaw'
    | 'commandRegex'
    | 'hostname'
    | 'path'
    | 'platform'
    | 'sha256'
    | 'template'
  >,
) {
  return JSON.stringify([
    entry.commandRaw,
    entry.commandRegex,
    entry.hostname,
    entry.path,
    entry.platform,
    entry.sha256,
    entry.template,
  ]);
}

function freezeEntry(entry: NtcTemplateManifestEntryV1): FrozenManifestEntry {
  return Object.freeze({ ...entry });
}

function freezeEntries(entries: FrozenManifestEntry[]): FrozenManifestEntries {
  return Object.freeze(entries.slice());
}

function parseEntry(value: unknown, index: number): FrozenManifestEntry {
  if (!isPlainObject(value)) {
    throw new Error(`Manifest entry ${index} must be a plain object.`);
  }

  const source = value;
  const entry = {} as NtcTemplateManifestEntryV1;

  for (const field of MANIFEST_ENTRY_FIELDS) {
    entry[field] = readOwnDataProperty(
      source,
      field,
      `Manifest entry ${field}`,
    ) as NtcTemplateManifestEntryV1[ManifestEntryField];
  }

  assertTemplatePath(entry.path);
  assertSha256(entry.sha256);

  return freezeEntry(entry);
}

export function parseNtcTemplateManifest(
  value: unknown,
): ParsedNtcTemplateManifestV1 {
  if (!isPlainObject(value)) {
    throw new Error('Manifest must be a plain object.');
  }

  readOwnLiteralNumberProperty(
    value,
    'schemaVersion',
    NTC_TEMPLATE_MANIFEST_SCHEMA_VERSION,
    'Manifest schemaVersion',
  );

  const version = readOwnDataProperty(value, 'version', 'Manifest version');
  if (!SAFE_VERSION_RE.test(version)) {
    throw new Error('Manifest version must have the format x.y.z.');
  }

  const generatedAt = readOwnDataProperty(
    value,
    'generatedAt',
    'Manifest generatedAt',
  );
  if (generatedAt.length === 0) {
    throw new Error('Manifest generatedAt must be a non-empty string.');
  }

  const entriesDescriptor = Object.getOwnPropertyDescriptor(value, 'entries');
  if (
    entriesDescriptor === undefined ||
    'get' in entriesDescriptor ||
    'set' in entriesDescriptor ||
    !Array.isArray(entriesDescriptor.value)
  ) {
    throw new Error('Manifest entries must be an array.');
  }

  const entriesSource = entriesDescriptor.value;
  if (
    Object.getPrototypeOf(entriesSource) !== Array.prototype ||
    Array.from({ length: entriesSource.length }, (_value, index) =>
      objectHasOwnProperty.call(entriesSource, index),
    ).includes(false)
  ) {
    throw new Error('Manifest entries must be a dense array.');
  }

  const seenIdentities = new Set<string>();
  const templateMetadataByPath = new Map<string, string>();
  const entries = entriesSource.map((entry, index) => {
    const parsedEntry = parseEntry(entry, index);
    const identity = serializeManifestEntryIdentity(parsedEntry);
    if (seenIdentities.has(identity)) {
      throw new Error('Manifest entry identity is duplicated.');
    }
    seenIdentities.add(identity);

    const templateMetadata = JSON.stringify([
      parsedEntry.template,
      parsedEntry.sha256,
    ]);
    const existingMetadata = templateMetadataByPath.get(parsedEntry.path);
    if (
      existingMetadata !== undefined &&
      existingMetadata !== templateMetadata
    ) {
      throw new Error(
        `Manifest entry path reuses ${parsedEntry.path} with conflicting template metadata.`,
      );
    }
    templateMetadataByPath.set(parsedEntry.path, templateMetadata);

    return parsedEntry;
  });

  return Object.freeze({
    entries: freezeEntries(entries),
    generatedAt,
    schemaVersion: NTC_TEMPLATE_MANIFEST_SCHEMA_VERSION,
    version,
  });
}
