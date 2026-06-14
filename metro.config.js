const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [...config.resolver.nodeModulesPaths, path.join(projectRoot, "node_modules")];

module.exports = config;
