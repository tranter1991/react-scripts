'use strict';

const isWsl = require('is-wsl');
const terserOptions = require('./terserOptions');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');

module.exports = function(handler, options) {
  const { shouldUseSourceMap } = options;
  const terserOpts = {
    isWsl: isWsl,
    shouldUseSourceMap: shouldUseSourceMap,
  };

  const cssOpts = {
    cssProcessorOptions: {
      parser: safePostCssParser,
      map: shouldUseSourceMap
        ? {
            // `inline: false` forces the sourcemap to be output into a
            // separate file
            inline: false,
            // `annotation: true` appends the sourceMappingURL to the end of
            // the css file, helping the browser find the sourcemap
            annotation: true,
          }
        : false,
    },
  };

  handler.config(webpackConfig => {
    webpackConfig.optimization
      .minimizer('terser')
      .use(TerserPlugin, [terserOptions(terserOpts)]);

    webpackConfig.optimization
      .minimizer('css')
      .use(OptimizeCSSAssetsPlugin, [cssOpts]);

    webpackConfig.optimization
      .splitChunks({
        chunks: 'all',
        name: true,
      })
      .runtimeChunk(true);
  });
};
