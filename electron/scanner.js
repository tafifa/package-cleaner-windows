const fs = require("node:fs/promises");
const path = require("node:path");

const MAX_SCAN_DEPTH = 5;
const INACTIVE_DAYS = 90;
const INACTIVE_MS = INACTIVE_DAYS * 24 * 60 * 60 * 1000;
const SKIP_DIR_NAMES = new Set([".git", "node_modules", "vendor", ".dart_tool", ".pub-cache"]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getDirectorySize(dirPath) {
  let total = 0;
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += await getDirectorySize(entryPath);
    } else if (entry.isFile()) {
      try {
        const stat = await fs.stat(entryPath);
        total += stat.size;
      } catch {
        total += 0;
      }
    }
  }

  return total;
}

async function detectProjectType(projectPath) {
  const checks = [
    { type: "js", marker: "package.json" },
    { type: "php", marker: "composer.json" },
    { type: "flutter", marker: "pubspec.yaml" }
  ];

  for (const check of checks) {
    if (await pathExists(path.join(projectPath, check.marker))) {
      return check.type;
    }
  }

  return null;
}

function findPackageFolder(projectPath, type) {
  if (type === "js") return path.join(projectPath, "node_modules");
  if (type === "php") return path.join(projectPath, "vendor");
  if (type === "flutter") return path.join(projectPath, ".dart_tool");
  return null;
}

function getPackageCandidates(projectPath, type) {
  if (type === "js") return [path.join(projectPath, "node_modules")];
  if (type === "php") return [path.join(projectPath, "vendor")];
  if (type === "flutter") {
    return [path.join(projectPath, ".dart_tool"), path.join(projectPath, ".pub-cache")];
  }
  return [];
}

async function isProjectInactive(projectPath) {
  try {
    const stat = await fs.stat(projectPath);
    return stat.mtimeMs < Date.now() - INACTIVE_MS;
  } catch {
    return false;
  }
}

async function scanProject(projectPath) {
  const type = await detectProjectType(projectPath);
  if (!type) return null;

  let projectStat;
  try {
    projectStat = await fs.stat(projectPath);
  } catch {
    return null;
  }
  const packageCandidates = getPackageCandidates(projectPath, type);
  const existingPackagePaths = [];
  let packageSizeBytes = 0;

  for (const packagePath of packageCandidates) {
    if (await pathExists(packagePath)) {
      existingPackagePaths.push(packagePath);
      packageSizeBytes += await getDirectorySize(packagePath);
    }
  }

  const packageExists = existingPackagePaths.length > 0;
  const inactive = packageExists ? await isProjectInactive(projectPath) : false;
  const packagePath = packageExists
    ? existingPackagePaths.join(" | ")
    : packageCandidates.join(" | ");

  return {
    id: projectPath,
    name: path.basename(projectPath),
    projectPath,
    type,
    packagePath,
    packagePaths: existingPackagePaths,
    packageCandidates,
    packageExists,
    packageSizeBytes,
    inactive,
    lastModifiedAt: projectStat.mtime.toISOString()
  };
}

async function collectDirectories(rootPath, depth = 0, directories = []) {
  if (depth > MAX_SCAN_DEPTH) return directories;

  directories.push(rootPath);

  let entries = [];
  try {
    entries = await fs.readdir(rootPath, { withFileTypes: true });
  } catch {
    return directories;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    await collectDirectories(path.join(rootPath, entry.name), depth + 1, directories);
  }

  return directories;
}

async function scanRootFolders(rootPaths, onProgress = null) {
  const roots = Array.isArray(rootPaths) ? rootPaths : [];
  const projects = [];
  const allDirectories = [];

  for (const rootPath of roots) {
    await collectDirectories(rootPath, 0, allDirectories);
  }

  const total = allDirectories.length || 1;
  let processed = 0;

  for (const currentPath of allDirectories) {
    const project = await scanProject(currentPath);
    if (project) projects.push(project);

    processed += 1;
    if (typeof onProgress === "function") {
      onProgress({
        processed,
        total,
        percent: Math.round((processed / total) * 100),
        currentPath
      });
    }
  }

  return projects;
}

module.exports = {
  scanRootFolders,
  getDirectorySize,
  detectProjectType,
  findPackageFolder,
  isProjectInactive
};
