const path = require('path');
const { createConfig } = require('@openedx/frontend-build');

const config = createConfig('webpack-dev');

config.resolve.alias = {
  ...config.resolve.alias,
  '@src': path.resolve(__dirname, 'src'),
  '@openedx/gym-frontend': path.resolve(__dirname, '@openedx/gym-frontend') || path.resolve(__dirname, 'node_modules/@openedx/gym-frontend'),
  './ErrorBoundary': path.resolve(__dirname, '@openedx/gym-frontend/overrides/ErrorBoundary') || path.resolve(__dirname, 'node_modules/@openedx/gym-frontend/overrides/ErrorBoundary'),
};

module.exports = config;
