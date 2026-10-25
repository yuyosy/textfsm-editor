import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import {
  assertSafeVersionSegment,
  createDefaultGeneratorConfig,
  generateNtcAssets,
  SAFE_TEMPLATE_BASENAME_RE,
} from './generate-ntc-assets.mjs';

const MAX_ARCHIVE_BYTES = 32 * 1024 * 1024;
const MAX_TAR_BYTES = 128 * 1024 * 1024;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Read regular files only; never extract archive paths onto the filesystem.
export function readArchive(archive, version) {
  const tar = gunzipSync(archive, { maxOutputLength: MAX_TAR_BYTES });
  const files = new Map();
  const root = `ntc_templates-${version}/`;
  let pax = {};
  const string = (buffer) => buffer.toString('utf8').replace(/\0.*$/su, '');
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const number = (start, end) => {
      const value = string(header.subarray(start, end)).trim();
      if (!/^[0-7]+$/u.test(value)) throw new Error('Invalid tar number.');
      return Number.parseInt(value, 8);
    };
    const checksum = header.reduce((sum, byte, index) =>
      sum + (index >= 148 && index < 156 ? 32 : byte), 0);
    if (checksum !== number(148, 156)) throw new Error('Invalid tar checksum.');
    const size = number(124, 136);
    const start = offset + 512;
    if (start + size > tar.length) throw new Error('Truncated tar member.');
    const contents = tar.subarray(start, start + size);
    offset = start + Math.ceil(size / 512) * 512;
    const type = header[156];
    if (type === 120) { // POSIX per-file extended headers (PAX).
      pax = {};
      for (let position = 0; position < contents.length;) {
        const space = contents.indexOf(32, position);
        const length = Number(contents.subarray(position, space).toString());
        if (space < position || !Number.isInteger(length) || length <= space - position + 1 || position + length > contents.length) {
          throw new Error('Invalid PAX record.');
        }
        const record = contents.subarray(space + 1, position + length - 1).toString('utf8');
        const equal = record.indexOf('=');
        if (equal < 1) throw new Error('Invalid PAX attribute.');
        pax[record.slice(0, equal)] = record.slice(equal + 1);
        position += length;
      }
      continue;
    }
    const prefix = string(header.subarray(345, 500));
    const name = pax.path ?? `${prefix ? `${prefix}/` : ''}${string(header.subarray(0, 100))}`;
    if ('size' in pax && Number(pax.size) !== size) throw new Error('Unsupported PAX size override.');
    pax = {};
    if (!name.startsWith(root)) continue;
    const relative = name.slice(root.length);
    const template = relative.startsWith('ntc_templates/templates/')
      ? relative.slice('ntc_templates/templates/'.length) : undefined;
    const destination = relative === 'LICENSE' ? 'LICENSE'
      : template === 'index' || (template && SAFE_TEMPLATE_BASENAME_RE.test(template))
        ? `templates/${template}` : undefined;
    if (!destination) continue;
    if (type !== 0 && type !== 48) throw new Error(`Expected regular file: ${name}`);
    if (files.has(destination)) throw new Error(`Duplicate archive file: ${name}`);
    files.set(destination, contents);
  }
  if (!files.has('LICENSE') || !files.has('templates/index') || files.size < 3) {
    throw new Error('Archive must contain LICENSE, index, and templates.');
  }
  return files;
}

async function fetchBytes(url, limit) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000), redirect: 'error' });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error(`Download exceeds ${limit} bytes: ${url}`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readDirectoryFiles(root, relative = '', files = new Map()) {
  const directory = path.join(root, relative);
  let stat;
  try {
    stat = await fs.lstat(directory);
  } catch (error) {
    if (error.code === 'ENOENT' && relative === '') return files;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`Expected a regular directory: ${directory}`);
  }
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) await readDirectoryFiles(root, name, files);
    else if (entry.isFile()) files.set(name, await fs.readFile(path.join(root, name)));
    else throw new Error(`Expected a regular file or directory: ${name}`);
  }
  return files;
}

async function writeDirectoryFiles(root, files, previousFiles = new Map()) {
  await fs.mkdir(root, { recursive: true });
  for (const [name, bytes] of files) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), bytes);
  }
  for (const name of previousFiles.keys()) {
    if (!files.has(name)) {
      try {
        await fs.unlink(path.join(root, name));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
}

export async function updateVendor({ version, archive, source, archiveSha256, retrievedAt, vendorRootPath, publicRootPath }) {
  version = assertSafeVersionSegment(version);
  if (sha256(archive) !== archiveSha256) throw new Error('Archive SHA-256 mismatch.');
  const files = readArchive(archive, version);
  const templates = [...files].filter(([name]) => name.endsWith('.textfsm'));
  const metadata = {
    name: 'ntc-templates', version, source, archiveSha256, retrievedAt,
    allowed_file_types: ['.textfsm', 'index'],
    template_count: templates.length,
    aggregate_bytes: templates.reduce((sum, [, bytes]) => sum + bytes.length, 0),
  };
  vendorRootPath = path.resolve(vendorRootPath);
  await fs.mkdir(path.dirname(vendorRootPath), { recursive: true });
  const stage = await fs.mkdtemp(path.join(path.dirname(vendorRootPath), '.ntc-update-'));
  const stagedVendor = path.join(stage, 'vendor');
  const backup = path.join(stage, 'previous');
  let previousFiles;
  let nextFiles;
  let updating = false;
  let preserveBackup = false;
  try {
    await fs.mkdir(path.join(stagedVendor, 'templates'), { recursive: true });
    for (const [name, contents] of files) await fs.writeFile(path.join(stagedVendor, name), contents);
    await fs.writeFile(path.join(stagedVendor, 'VERSION'), `${version}\n`);
    await fs.writeFile(path.join(stagedVendor, 'SOURCE.json'), `${JSON.stringify(metadata, null, 2)}\n`);
    // Validate index references and generate assets before touching the current vendor.
    await generateNtcAssets({ vendorRootPath: stagedVendor, publicRootPath: path.join(stage, 'public') });
    previousFiles = await readDirectoryFiles(vendorRootPath);
    nextFiles = await readDirectoryFiles(stagedVendor);
    await writeDirectoryFiles(backup, previousFiles);
    // Keep directory handles valid on Windows and network drives. A directory
    // rename can fail with EPERM even when its files can be updated normally.
    updating = true;
    await writeDirectoryFiles(vendorRootPath, nextFiles, previousFiles);
    await generateNtcAssets({ vendorRootPath, publicRootPath });
  } catch (error) {
    if (updating) {
      try {
        await writeDirectoryFiles(vendorRootPath, previousFiles, nextFiles);
      } catch (restoreError) {
        preserveBackup = true;
        throw new AggregateError([error, restoreError], `Vendor update and recovery failed. Previous files are preserved at ${backup}`);
      }
    }
    throw error;
  } finally {
    if (!preserveBackup) await fs.rm(stage, { recursive: true, force: true });
  }
  return metadata;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    process.stdout.write('Usage: npm run vendor:ntc -- --version <x.y.z>\n');
    return;
  }
  if (args.length !== 2 || args[0] !== '--version') throw new Error('Usage: npm run vendor:ntc -- --version <x.y.z>');
  const version = assertSafeVersionSegment(args[1]);
  const release = JSON.parse((await fetchBytes(`https://pypi.org/pypi/ntc-templates/${version}/json`, 4 * 1024 * 1024)).toString('utf8'));
  const distribution = release.urls.find((entry) => entry.packagetype === 'sdist');
  if (!distribution) throw new Error(`No source distribution for ${version}.`);
  const url = new URL(distribution.url);
  if (url.protocol !== 'https:' || url.hostname !== 'files.pythonhosted.org') throw new Error('Unexpected archive host.');
  const metadata = await updateVendor({
    ...createDefaultGeneratorConfig(), version,
    archive: await fetchBytes(url.href, MAX_ARCHIVE_BYTES),
    source: url.href, archiveSha256: distribution.digests.sha256,
    retrievedAt: new Date().toISOString().slice(0, 10),
  });
  process.stdout.write(`Updated ntc-templates ${version}: ${metadata.template_count} templates (${metadata.aggregate_bytes} bytes).\nGenerated THIRD_PARTY_NOTICES.txt for template data, runtime dependencies, and CDN Monaco.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
