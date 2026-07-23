// Used only by Jest (via babel-jest) to compile plain .js sources
// (server.js, roomStore.js, logger.js) so backend tests can import the real
// ESM server code under Jest's classic CommonJS runtime. Not used by the
// Vite build, which has its own esbuild/rollup pipeline.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  plugins: ['babel-plugin-transform-import-meta'],
};
