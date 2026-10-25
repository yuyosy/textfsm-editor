import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateThirdPartyNotices } from './generate-third-party-notices.mjs';

export const MANIFEST_SCHEMA_VERSION = 1;
export const MAX_TEMPLATE_BYTES = 1024 * 1024;
export const SAFE_TEMPLATE_BASENAME_RE = /^[a-zA-Z0-9_.-]+\.textfsm$/u;
export const SAFE_VERSION_SEGMENT_RE = /^\d+\.\d+\.\d+$/u;

const INDEX_FILENAME = 'index';
const SOURCE_FILENAME = 'SOURCE.json';
const VERSION_FILENAME = 'VERSION';

function isPathInsideRoot(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
}

export function resolvePathUnderRoot(rootPath, relativePath, label) {
  const resolvedRootPath = path.resolve(rootPath);
  const resolvedPath = path.resolve(resolvedRootPath, relativePath);

  if (!isPathInsideRoot(resolvedRootPath, resolvedPath)) {
    throw new Error(`${label} escapes its configured root: ${relativePath}`);
  }

  return resolvedPath;
}

export function assertSafeVersionSegment(rawVersion) {
  const version = rawVersion.trim();

  if (version.length === 0) {
    throw new Error('Unsafe version segment: value must not be empty.');
  }

  if (version === '.' || version === '..') {
    throw new Error(`Unsafe version segment: ${rawVersion}`);
  }

  if (/[/\\%]/u.test(version)) {
    throw new Error(`Unsafe version segment: ${rawVersion}`);
  }

  for (const char of version) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7F) {
      throw new Error(`Unsafe version segment: ${rawVersion}`);
    }
  }

  if (!SAFE_VERSION_SEGMENT_RE.test(version)) {
    throw new Error(`Unsafe version segment: ${rawVersion}`);
  }

  return version;
}

export function resolveDirectChildPath(rootPath, childSegment, label) {
  const resolvedRootPath = path.resolve(rootPath);
  const resolvedPath = path.resolve(resolvedRootPath, childSegment);

  if (path.dirname(resolvedPath) !== resolvedRootPath) {
    throw new Error(`${label} must resolve to a direct child of its configured root.`);
  }

  return resolvedPath;
}

async function assertPathIsNotSymlink(targetPath, label) {
  const stat = await fs.lstat(targetPath);
  if (stat.isSymbolicLink()) {
    throw new Error(`${label} must not be a symbolic link: ${targetPath}`);
  }
  return stat;
}

async function ensureDirectory(targetPath, label) {
  await fs.mkdir(targetPath, { recursive: true });
  await assertPathIsNotSymlink(targetPath, label);
}

async function writeGeneratedFile(targetPath, bytes) {
  const contents = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  try {
    const stat = await assertPathIsNotSymlink(targetPath, 'Generated file');
    if (!stat.isFile()) throw new Error(`Expected generated file: ${targetPath}`);
    if ((await fs.readFile(targetPath)).equals(contents)) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(targetPath, contents);
}

function splitIndexLine(line, lineNumber) {
  const fields = [];
  let cursor = 0;

  for (let index = 0; index < 3; index += 1) {
    const separatorIndex = line.indexOf(',', cursor);
    if (separatorIndex < 0) {
      throw new Error(`Invalid index line ${lineNumber}: ${line}`);
    }
    fields.push(line.slice(cursor, separatorIndex).trim());
    cursor = separatorIndex + 1;
  }

  fields.push(line.slice(cursor).trim());

  if (fields.length !== 4 || fields.some((field) => field.length === 0)) {
    throw new Error(`Invalid index line ${lineNumber}: ${line}`);
  }

  return fields;
}

export function convertCommandToRegex(commandRaw) {
  return commandRaw.replace(/\[\[([^\]]+)\]\]/gu, (_match, chars) => {
    let result = chars.at(-1);
    for (let index = chars.length - 2; index >= 0; index -= 1) {
      result = `${chars[index]}(${result})?`;
    }
    return `(${result})?`;
  });
}

export function expandPlatformAlternatives(platform) {
  if (!platform.includes('(')) {
    return [platform];
  }

  const alternativesList = [];
  let currentPosition = 0;
  let prefix = '';

  for (const match of platform.matchAll(/\(([^)]+)\)/gu)) {
    const [rawMatch, rawAlternatives] = match;
    const matchIndex = match.index ?? -1;
    if (matchIndex < 0) {
      continue;
    }
    prefix += platform.slice(currentPosition, matchIndex);
    alternativesList.push(rawAlternatives.split('|').map((value) => value.trim()));
    currentPosition = matchIndex + rawMatch.length;
  }

  if (alternativesList.length === 0) {
    return [platform];
  }

  const suffix = platform.slice(currentPosition);
  let expandedValues = alternativesList[0].map((alternative) => `${prefix}${alternative}`);

  for (let index = 1; index < alternativesList.length; index += 1) {
    const nextValues = [];
    for (const value of expandedValues) {
      for (const alternative of alternativesList[index]) {
        nextValues.push(`${value}${alternative}`);
      }
    }
    expandedValues = nextValues;
  }

  return expandedValues.map((value) => `${value}${suffix}`);
}

export function parseTemplateNames(templateField) {
  const templateNames = templateField.split(':').map((value) => value.trim());
  const seenNames = new Set();

  for (const templateName of templateNames) {
    assertSafeTemplateBasename(templateName);
    if (seenNames.has(templateName)) {
      throw new Error(`Duplicate template name in index entry: ${templateName}`);
    }
    seenNames.add(templateName);
  }

  return templateNames;
}

export function assertSafeTemplateBasename(templateName) {
  if (
    templateName.includes('..') ||
    templateName.includes('/') ||
    templateName.includes('\\') ||
    !SAFE_TEMPLATE_BASENAME_RE.test(templateName)
  ) {
    throw new Error(`Unsafe template basename: ${templateName}`);
  }
}

export function parseIndexFile(indexText) {
  const entries = [];
  let headerValidated = false;
  let lineNumber = 0;

  for (const rawLine of indexText.split(/\r?\n/gu)) {
    lineNumber += 1;
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const fields = splitIndexLine(line, lineNumber);
    if (!headerValidated) {
      const normalizedFields = fields.map((field) => field.toLowerCase());
      if (
        normalizedFields[0] !== 'template' ||
        normalizedFields[1] !== 'hostname' ||
        normalizedFields[2] !== 'platform' ||
        normalizedFields[3] !== 'command'
      ) {
        throw new Error(`Unexpected index header: ${line}`);
      }
      headerValidated = true;
      continue;
    }

    const [templateField, hostname, platformField, commandRaw] = fields;
    const templates = parseTemplateNames(templateField);
    const platforms = expandPlatformAlternatives(platformField);
    const commandRegex = convertCommandToRegex(commandRaw);

    for (const template of templates) {
      for (const platform of platforms) {
        entries.push({
          commandRaw,
          commandRegex,
          hostname,
          platform,
          template,
        });
      }
    }
  }

  if (!headerValidated) {
    throw new Error('Index header was not found.');
  }

  return entries;
}

async function readJsonFile(jsonPath, label) {
  await assertPathIsNotSymlink(jsonPath, label);
  const fileContent = await fs.readFile(jsonPath, 'utf8');
  return JSON.parse(fileContent);
}

async function readUtf8File(textPath, label) {
  await assertPathIsNotSymlink(textPath, label);
  return fs.readFile(textPath, 'utf8');
}

async function loadVendorTemplates(templatesRootPath) {
  await assertPathIsNotSymlink(templatesRootPath, 'Vendor templates directory');
  const directoryEntries = await fs.readdir(templatesRootPath, {
    withFileTypes: true,
  });
  const templates = new Map();
  const collisionKeys = new Map();

  for (const directoryEntry of directoryEntries) {
    const entryPath = resolvePathUnderRoot(
      templatesRootPath,
      directoryEntry.name,
      'Vendor template entry',
    );
    const stat = await assertPathIsNotSymlink(entryPath, 'Vendor template entry');

    if (directoryEntry.name === INDEX_FILENAME) {
      if (!stat.isFile()) {
        throw new Error('Vendor index must be a file.');
      }
      continue;
    }

    if (!stat.isFile()) {
      throw new Error(`Unexpected non-file in vendor templates: ${directoryEntry.name}`);
    }

    assertSafeTemplateBasename(directoryEntry.name);

    if (stat.size > MAX_TEMPLATE_BYTES) {
      throw new Error(
        `Template exceeds ${MAX_TEMPLATE_BYTES} bytes: ${directoryEntry.name}`,
      );
    }

    const collisionKey = directoryEntry.name.toLowerCase();
    const existingName = collisionKeys.get(collisionKey);
    if (existingName !== undefined) {
      throw new Error(
        `Duplicate template names differ only by case: ${existingName} and ${directoryEntry.name}`,
      );
    }
    collisionKeys.set(collisionKey, directoryEntry.name);

    const templateBytes = await fs.readFile(entryPath);
    templates.set(directoryEntry.name, {
      bytes: templateBytes,
      path: entryPath,
      sha256: createHash('sha256').update(templateBytes).digest('hex'),
      size: templateBytes.byteLength,
    });
  }

  return templates;
}

function compareManifestEntries(leftEntry, rightEntry) {
  return (
    leftEntry.platform.localeCompare(rightEntry.platform) ||
    leftEntry.template.localeCompare(rightEntry.template) ||
    leftEntry.hostname.localeCompare(rightEntry.hostname) ||
    leftEntry.commandRaw.localeCompare(rightEntry.commandRaw) ||
    leftEntry.commandRegex.localeCompare(rightEntry.commandRegex) ||
    leftEntry.path.localeCompare(rightEntry.path) ||
    leftEntry.sha256.localeCompare(rightEntry.sha256)
  );
}

export function createDefaultGeneratorConfig() {
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptsDirectory = path.dirname(scriptPath);
  const frontendRootPath = path.resolve(scriptsDirectory, '..');

  return {
    publicRootPath: path.join(frontendRootPath, 'src', 'public', 'ntc-templates'),
    vendorRootPath: path.join(frontendRootPath, 'vendor', 'ntc-templates'),
  };
}

function resolveGeneratedAt(sourceDateEpoch, retrievedAt) {
  if (sourceDateEpoch !== undefined && sourceDateEpoch !== '') {
    if (!/^\d+$/u.test(sourceDateEpoch)) {
      throw new Error(`SOURCE_DATE_EPOCH must be an integer: ${sourceDateEpoch}`);
    }
    return new Date(Number.parseInt(sourceDateEpoch, 10) * 1000).toISOString();
  }

  if (typeof retrievedAt !== 'string' || retrievedAt.length === 0) {
    throw new Error('SOURCE.json retrievedAt must be a non-empty string.');
  }

  return retrievedAt;
}

export async function generateNtcAssets(options = {}) {
  const vendorRootPath = path.resolve(
    options.vendorRootPath ?? createDefaultGeneratorConfig().vendorRootPath,
  );
  const publicRootPath = path.resolve(
    options.publicRootPath ?? createDefaultGeneratorConfig().publicRootPath,
  );
  const sourceDateEpoch = options.sourceDateEpoch ?? process.env.SOURCE_DATE_EPOCH;

  await assertPathIsNotSymlink(vendorRootPath, 'Vendor root');
  const vendorTemplatesRootPath = resolvePathUnderRoot(
    vendorRootPath,
    'templates',
    'Vendor templates directory',
  );
  const indexPath = resolvePathUnderRoot(
    vendorTemplatesRootPath,
    INDEX_FILENAME,
    'Vendor index',
  );
  const sourcePath = resolvePathUnderRoot(vendorRootPath, SOURCE_FILENAME, 'Vendor source');
  const versionPath = resolvePathUnderRoot(
    vendorRootPath,
    VERSION_FILENAME,
    'Vendor version',
  );

  const sourceMetadata = await readJsonFile(sourcePath, 'Vendor source');
  const version = assertSafeVersionSegment(
    await readUtf8File(versionPath, 'Vendor version'),
  );

  if (sourceMetadata.version !== version) {
    throw new Error(
      `Vendor version mismatch: VERSION=${version}, SOURCE.json=${sourceMetadata.version}`,
    );
  }

  const templates = await loadVendorTemplates(vendorTemplatesRootPath);
  const indexText = await readUtf8File(indexPath, 'Vendor index');
  const manifestEntries = parseIndexFile(indexText).map((entry) => {
    const templateData = templates.get(entry.template);
    if (templateData === undefined) {
      throw new Error(`Index references missing template: ${entry.template}`);
    }

    return {
      commandRaw: entry.commandRaw,
      commandRegex: entry.commandRegex,
      hostname: entry.hostname,
      path: `templates/${entry.template}`,
      platform: entry.platform,
      sha256: templateData.sha256,
      template: entry.template,
    };
  });

  manifestEntries.sort(compareManifestEntries);

  const generatedAt = resolveGeneratedAt(sourceDateEpoch, sourceMetadata.retrievedAt);
  const templatesOutputRootPath = resolvePathUnderRoot(
    publicRootPath,
    'templates',
    'Generated templates output',
  );

  await ensureDirectory(publicRootPath, 'Generated public root');
  await ensureDirectory(templatesOutputRootPath, 'Generated templates output');

  // Preserve directory handles on Windows; remove only obsolete template files.
  for (const entry of await fs.readdir(templatesOutputRootPath, { withFileTypes: true })) {
    const outputPath = resolveDirectChildPath(templatesOutputRootPath, entry.name, 'Generated template');
    await assertPathIsNotSymlink(outputPath, 'Generated template');
    assertSafeTemplateBasename(entry.name);
    if (!entry.isFile()) throw new Error(`Expected generated template file: ${outputPath}`);
    if (!templates.has(entry.name)) await fs.unlink(outputPath);
  }

  let templateBytesTotal = 0;
  for (const [templateName, templateData] of [...templates.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    const outputPath = resolvePathUnderRoot(
      templatesOutputRootPath,
      templateName,
      'Generated template output',
    );
    await writeGeneratedFile(outputPath, templateData.bytes);
    templateBytesTotal += templateData.size;
  }

  const manifestPath = resolvePathUnderRoot(
    publicRootPath,
    'manifest.json',
    'Generated manifest output',
  );
  const manifest = {
    entries: manifestEntries,
    generatedAt,
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    version,
  };
  await writeGeneratedFile(manifestPath, `${JSON.stringify(manifest)}\n`);
  const noticesPath = path.join(path.dirname(publicRootPath), 'THIRD_PARTY_NOTICES.txt');
  await generateThirdPartyNotices({ vendorRootPath, outputPath: noticesPath });

  // Migrate the previous versioned layout after the new assets are complete.
  for (const entry of await fs.readdir(publicRootPath, { withFileTypes: true })) {
    if (!SAFE_VERSION_SEGMENT_RE.test(entry.name)) continue;
    const legacyPath = resolveDirectChildPath(publicRootPath, entry.name, 'Legacy generated output');
    const stat = await assertPathIsNotSymlink(legacyPath, 'Legacy generated output');
    if (!stat.isDirectory()) continue;
    let legacyManifest;
    try {
      legacyManifest = await readJsonFile(path.join(legacyPath, 'manifest.json'), 'Legacy manifest');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (legacyManifest.version === entry.name && legacyManifest.schemaVersion === MANIFEST_SCHEMA_VERSION) {
      await fs.rm(legacyPath, { force: true, recursive: true });
    }
  }

  return {
    generatedAt,
    manifest,
    manifestPath,
    noticesPath,
    templateBytesTotal,
    templateCount: templates.size,
    version,
    publicRootPath,
  };
}

async function main() {
  const result = await generateNtcAssets();
  process.stdout.write(
    `Generated ${result.templateCount} templates (${result.templateBytesTotal} bytes) into ${result.publicRootPath}\n`,
  );
}

const isCliInvocation =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliInvocation) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
