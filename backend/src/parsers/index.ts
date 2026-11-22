import { LicenseId } from '../types';
import { normalizeLicense } from '../data/licenses';

export interface ParsedDependency {
  name: string;
  version: string;
  license: LicenseId;
  direct: boolean;
}

export function parseNpmPackageJson(content: string): ParsedDependency[] {
  const pkg = JSON.parse(content);
  const deps: ParsedDependency[] = [];

  const addDeps = (map: Record<string, string> | undefined, direct: boolean) => {
    if (!map) return;
    for (const [name, version] of Object.entries(map)) {
      deps.push({
        name,
        version: (version as string).replace(/[\^~>=<]/, ''),
        license: 'UNKNOWN',
        direct,
      });
    }
  };

  addDeps(pkg.dependencies, true);
  addDeps(pkg.devDependencies, false);
  addDeps(pkg.peerDependencies, false);

  return deps;
}

export function parseNpmPackageLock(content: string): ParsedDependency[] {
  const lock = JSON.parse(content);
  const deps: ParsedDependency[] = [];
  const topDeps = new Set<string>(Object.keys(lock.dependencies || {}));

  const packages = lock.packages || lock.dependencies || {};
  for (const [name, info] of Object.entries(packages as Record<string, any>)) {
    if (!name) continue;
    const pkgName = name.replace(/^node_modules\//, '');
    if (!pkgName) continue;

    deps.push({
      name: pkgName,
      version: info.version || '0.0.0',
      license: normalizeLicense(info.license),
      direct: topDeps.has(pkgName),
    });
  }

  return deps;
}

export function parsePipRequirements(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;

    const match = trimmed.match(/^([a-zA-Z0-9_.-]+)([>=<!]=?)?([0-9.*]+)?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[3] || 'latest',
        license: 'UNKNOWN',
        direct: true,
      });
    }
  }

  return deps;
}

export function parsePipfileLock(content: string): ParsedDependency[] {
  const lock = JSON.parse(content);
  const deps: ParsedDependency[] = [];

  const addSection = (section: Record<string, any> | undefined, direct: boolean) => {
    if (!section) return;
    for (const [name, info] of Object.entries(section)) {
      if (name === '_meta') continue;
      const version = typeof info === 'string' ? info : (info as any).version || 'unknown';
      deps.push({
        name,
        version: version.replace(/[=<>!]/, ''),
        license: 'UNKNOWN',
        direct,
      });
    }
  };

  addSection(lock.default, true);
  addSection(lock.develop, false);

  return deps;
}

export function parseMavenPom(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];

  const dependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  const groupIdRegex = /<groupId>(.*?)<\/groupId>/;
  const artifactIdRegex = /<artifactId>(.*?)<\/artifactId>/;
  const versionRegex = /<version>(.*?)<\/version>/;
  const scopeRegex = /<scope>(.*?)<\/scope>/;

  let match;
  while ((match = dependencyRegex.exec(content)) !== null) {
    const block = match[1];
    const groupId = groupIdRegex.exec(block)?.[1] || '';
    const artifactId = artifactIdRegex.exec(block)?.[1] || '';
    const version = versionRegex.exec(block)?.[1] || 'unknown';
    const scope = scopeRegex.exec(block)?.[1] || 'compile';

    if (groupId && artifactId) {
      deps.push({
        name: `${groupId}:${artifactId}`,
        version,
        license: 'UNKNOWN',
        direct: scope === 'compile' || scope === 'runtime',
      });
    }
  }

  return deps;
}

export function detectEcosystem(
  filename: string
): 'npm' | 'pip' | 'maven' | 'gradle' | 'composer' | 'unknown' {
  const name = filename.toLowerCase();
  if (name === 'package.json' || name === 'package-lock.json') return 'npm';
  if (name === 'requirements.txt' || name === 'pipfile.lock') return 'pip';
  if (name === 'pom.xml') return 'maven';
  if (name === 'build.gradle' || name === 'build.gradle.kts') return 'gradle';
  if (name === 'composer.json' || name === 'composer.lock') return 'composer';
  return 'unknown';
}

export function parseFile(
  filename: string,
  content: string
): { deps: ParsedDependency[]; ecosystem: ReturnType<typeof detectEcosystem> } {
  const ecosystem = detectEcosystem(filename);
  const name = filename.toLowerCase();

  let deps: ParsedDependency[] = [];

  if (name === 'package-lock.json') {
    deps = parseNpmPackageLock(content);
  } else if (name === 'package.json') {
    deps = parseNpmPackageJson(content);
  } else if (name === 'requirements.txt') {
    deps = parsePipRequirements(content);
  } else if (name === 'pipfile.lock') {
    deps = parsePipfileLock(content);
  } else if (name === 'pom.xml') {
    deps = parseMavenPom(content);
  } else {
    throw new Error(`Unsupported file: ${filename}`);
  }

  return { deps, ecosystem };
}
