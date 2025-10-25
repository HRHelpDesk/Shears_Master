const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [
    path.resolve(__dirname, '../..')  // Root for workspaces
  ],
  resolver: {
    extraNodeModules: {
      'shears-shared': path.resolve(__dirname, '../shears-shared'),

    }
  }
};

module.exports = mergeConfig(defaultConfig, config);