'use strict';

const paths = require('./../paths');
const resolve = require('resolve');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const getClientEnvironment = require('./../env');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const webpack = require('webpack');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer');

module.exports = function(handler, options) {
  const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';
  const {isEnvProduction, isEnvDevelopment, appConfig} = options;
  const publicPath = isEnvProduction
    ? paths.servedPath
    : isEnvDevelopment && '/';
  const publicUrl = isEnvProduction
  ? publicPath.slice(0, -1)
  : isEnvDevelopment && '';
// Get environment variables to inject into our app.
  const env = getClientEnvironment(publicUrl);
  const htmlWebpackOptions = Object.assign(
    {},
    {
      inject: true,
      template: paths.appHtml,
    },
    isEnvProduction
      ? {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }
      : undefined
  );

  const useTypeScript = fs.existsSync(paths.appTsConfig);

  handler.config(webpackConfig => {
    webpackConfig
      .plugin('html')
        .use(HtmlWebpackPlugin,[htmlWebpackOptions])

    if(isEnvProduction &&
      shouldInlineRuntimeChunk){
        webpackConfig.plugin('inlineChunkHtmlPlugin')
          .use(InlineChunkHtmlPlugin, [HtmlWebpackPlugin, [/runtime~.+[.]js/]])
    }

    webpackConfig
      .plugin('interpolateHtml')
        .use(InterpolateHtmlPlugin,[HtmlWebpackPlugin, env.raw])
        .end()
      .plugin('moduleNotFound')
        .use(ModuleNotFoundPlugin, [paths.appPath])
        .end()
      .plugin('define')
        .use(webpack.DefinePlugin, [env.stringified])
        .end()
    
    if(isEnvDevelopment){
      webpackConfig
        .plugin('hotModuleReplacement')
          .use(webpack.HotModuleReplacementPlugin)
          .end()
        .plugin('caseSensitivePaths')
          .use(CaseSensitivePathsPlugin)
          .end()
        .plugin('watchMissingNodeModules')
          .use(WatchMissingNodeModulesPlugin, [paths.appNodeModules])
    }

    if(isEnvProduction){
      webpackConfig
        .plugin('miniCssExtractPlugin').use(MiniCssExtractPlugin, [{
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }])
    }

    webpackConfig
      .plugin('manifestPlugin')
        .use(ManifestPlugin, [{
          fileName: 'asset-manifest.json',
          publicPath: publicPath,
          generate: (seed, files) => {
            const manifestFiles = files.reduce(function(manifest, file) {
              manifest[file.name] = file.path;
              return manifest;
            }, seed);

            return {
              files: manifestFiles,
            };
          },
        }])
        .end()
      .plugin('ignore')
        .use(webpack.IgnorePlugin, [/^\.\/locale$/, /moment$/])
        .end()

    if(isEnvProduction){
      webpackConfig
        .plugin('generateSW')
          .use(WorkboxWebpackPlugin.GenerateSW, [{
            clientsClaim: true,
            exclude: [/\.map$/, /asset-manifest\.json$/],
            importWorkboxFrom: 'cdn',
            navigateFallback: publicUrl + '/index.html',
            navigateFallbackBlacklist: [
              // Exclude URLs starting with /_, as they're likely an API call
              new RegExp('^/_'),
              // Exclude URLs containing a dot, as they're likely a resource in
              // public/ and not a SPA route
              new RegExp('/[^/]+\\.[^/]+$'),
            ],
          }])
    }

    if(useTypeScript){
      webpackConfig
      .plugin('generateSW')
        .use(ForkTsCheckerWebpackPlugin, [{
          typescript: resolve.sync('typescript', {
            basedir: paths.appNodeModules,
          }),
          async: isEnvDevelopment,
          useTypescriptIncrementalApi: true,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? `${__dirname}/pnpTs.js`
            : undefined,
          tsconfig: paths.appTsConfig,
          reportFiles: [
            '**',
            '!**/__tests__/**',
            '!**/?(*.)(spec|test).*',
            '!**/src/setupProxy.*',
            '!**/src/setupTests.*',
          ],
          watch: paths.appSrc,
          silent: true,
          // The formatter is invoked directly in WebpackDevServerUtils during development
          formatter: isEnvProduction ? typescriptFormatter : undefined,
          ignoreDiagnostics: appConfig.ignoreTSError || [],
        }])
    }

    if (process.env.EN_ANALYZER === 'true') {
      webpackConfig
        .plugin('bundleAnalyzer')
        .use(BundleAnalyzerPlugin.BundleAnalyzerPlugin);
    }
  })
}