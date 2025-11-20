const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Entferne ModuleScopePlugin, um Imports außerhalb von src/ zu erlauben
  config.resolve.plugins = config.resolve.plugins.filter(
    plugin => plugin.constructor.name !== 'ModuleScopePlugin'
  );

  // Füge Polyfills für Node.js-Module hinzu
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "path": require.resolve("path-browserify"),
    "buffer": require.resolve("buffer"),
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "timers": require.resolve("timers-browserify"),
    "vm": require.resolve("vm-browserify"),
    "process": require.resolve("process/browser"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false
  };

  // Füge Buffer als globale Variable hinzu
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];
  
  // Ignoriere Warnungen für PDF.js
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map/,
  ];

  return config;
};
