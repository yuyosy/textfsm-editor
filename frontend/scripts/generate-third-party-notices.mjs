import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTICE_FILE_RE = /^(?:licen[sc]e|copying|notice|third[-_]?party[-_]?notices)(?:[._-].*)?$/iu;
const hash = (text) => createHash('sha256').update(text).digest('hex');
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

export async function collectRuntimeNotices(root = projectRoot) {
  const lock = await readJson(path.join(root, 'package-lock.json'));
  if (lock.lockfileVersion < 2 || !lock.packages) throw new Error('An npm lockfile with package metadata is required.');
  const notices = [];
  for (const [location, locked] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
    if (!location || locked.dev === true) continue;
    const directory = path.resolve(root, location);
    const relative = path.relative(root, directory);
    if (relative.startsWith('..') || path.isAbsolute(relative) || locked.link) {
      throw new Error(`Unsupported dependency location: ${location}`);
    }
    let pkg;
    try {
      pkg = await readJson(path.join(directory, 'package.json'));
    } catch (error) {
      if (error.code === 'ENOENT' && locked.optional) continue;
      throw new Error(`Cannot read ${location}; run npm ci before generating notices.`, { cause: error });
    }
    if (pkg.version !== locked.version) throw new Error(`Installed ${pkg.name} differs from package-lock.json; run npm ci.`);
    const parts = [`${pkg.name} ${pkg.version}`, `License: ${pkg.license ?? locked.license ?? 'See license text below'}`];
    if (pkg.homepage) parts.push(`Project: ${pkg.homepage}`);
    let licenseFound = false;
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !NOTICE_FILE_RE.test(entry.name)) continue;
      if (/^(?:licen[sc]e|copying)/iu.test(entry.name)) licenseFound = true;
      parts.push('', `${entry.name} (verbatim):`, await fs.readFile(path.join(directory, entry.name), 'utf8'));
    }
    if (!licenseFound) {
      const overridePath = path.join(root, 'vendor/license-overrides', `${pkg.name.replace('/', '__')}.json`);
      let override;
      try {
        override = await readJson(overridePath);
      } catch (error) {
        throw new Error(`No license text found for ${pkg.name} ${pkg.version}; supply its license before publishing.`, { cause: error });
      }
      if (override.name !== pkg.name || override.version !== pkg.version || hash(override.text) !== override.sha256) {
        throw new Error(`License override for ${pkg.name} must be reviewed for ${pkg.version}.`);
      }
      parts.push('', `License source: ${override.source}`, override.note, '', 'LICENSE (verbatim):', override.text);
    }
    notices.push(parts.join('\n'));
  }
  return notices.join('\n\n------------------------------------------------------------\n\n');
}

export async function getMonacoCdnSource(root = projectRoot) {
  const config = await fs.readFile(path.join(root, 'node_modules/@monaco-editor/loader/lib/es/config/index.js'), 'utf8');
  const match = config.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@(\d+\.\d+\.\d+)\/min\/vs/u);
  if (!match) throw new Error('Cannot identify the Monaco loader CDN version; review its configuration.');
  return { version: match[1], source: match[0].replace(/\/min\/vs$/u, '') };
}

export async function syncMonacoNotices(root = projectRoot) {
  const metadata = await getMonacoCdnSource(root);
  const directory = path.join(root, 'vendor/monaco-editor-cdn');
  const downloads = {};
  for (const name of ['LICENSE', 'ThirdPartyNotices.txt']) {
    const response = await fetch(`${metadata.source}/${name}`, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
    if (!response.ok) throw new Error(`Monaco ${name} download failed: HTTP ${response.status}`);
    const text = await response.text();
    if (!text.trim() || Buffer.byteLength(text) > 1024 * 1024) throw new Error(`Invalid Monaco ${name}.`);
    downloads[name] = text;
  }
  await fs.mkdir(directory, { recursive: true });
  for (const [name, text] of Object.entries(downloads)) await fs.writeFile(path.join(directory, name), text);
  await fs.writeFile(path.join(directory, 'SOURCE.json'), `${JSON.stringify({ ...metadata,
    sha256: Object.fromEntries(Object.entries(downloads).map(([name, text]) => [name, hash(text)])),
  }, null, 2)}\n`);
  return metadata;
}

async function collectMonacoCdnNotices(root) {
  const expected = await getMonacoCdnSource(root);
  const directory = path.join(root, 'vendor/monaco-editor-cdn');
  let metadata;
  try {
    metadata = await readJson(path.join(directory, 'SOURCE.json'));
  } catch (error) {
    throw new Error('Monaco CDN notices are missing; run npm run licenses:monaco.', { cause: error });
  }
  if (metadata.source !== expected.source || metadata.version !== expected.version) {
    throw new Error('Monaco CDN version changed; run npm run licenses:monaco.');
  }
  const parts = [`Monaco Editor ${metadata.version} (loaded from CDN)`, `Source: ${metadata.source}`, 'License: MIT'];
  for (const name of ['LICENSE', 'ThirdPartyNotices.txt']) {
    const text = await fs.readFile(path.join(directory, name), 'utf8');
    if (hash(text) !== metadata.sha256[name]) throw new Error(`Monaco ${name} checksum mismatch; run npm run licenses:monaco.`);
    parts.push('', `${name} (verbatim):`, text);
  }
  return parts.join('\n');
}

export async function generateThirdPartyNotices({
  vendorRootPath = path.join(projectRoot, 'vendor/ntc-templates'),
  outputPath = path.join(projectRoot, 'src/public/THIRD_PARTY_NOTICES.txt'),
  root = projectRoot,
} = {}) {
  const metadata = await readJson(path.join(vendorRootPath, 'SOURCE.json'));
  const license = await fs.readFile(path.join(vendorRootPath, 'LICENSE'), 'utf8');
  const contents = [
    'Third-party notices',
    'Automatically generated. Includes installed runtime dependencies and their transitive dependencies.',
    'Some listed packages may be removed by bundling. Build-only dependencies are excluded.',
    '',
    `ntc-templates ${metadata.version}`,
    'Project: https://github.com/networktocode/ntc-templates',
    `Source archive: ${metadata.source}`,
    'License: Apache-2.0', '', 'LICENSE (verbatim):', license,
    '', await collectMonacoCdnNotices(root),
    '', 'Installed runtime dependencies (including bundled TxtFSM / Google TextFSM notices)',
    '', await collectRuntimeNotices(root), '',
  ].join('\n');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, contents);
  return outputPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--sync-monaco') {
      const result = await syncMonacoNotices();
      process.stdout.write(`Saved Monaco ${result.version} CDN notices.\n`);
    } else if (args.length) {
      throw new Error('Usage: node scripts/generate-third-party-notices.mjs [--sync-monaco]');
    } else {
      process.stdout.write(`Generated ${await generateThirdPartyNotices()}\n`);
    }
  })().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
