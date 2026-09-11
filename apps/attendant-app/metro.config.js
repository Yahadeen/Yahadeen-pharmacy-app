// Metro config for a pnpm monorepo: watch the workspace root so changes in
// `packages/shared` trigger a rebuild, and let the resolver fall back to the
// hoisted root `node_modules` (see `.npmrc` → node-linker=hoisted).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Workspace packages ship raw TS; make sure Metro treats them as source.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
