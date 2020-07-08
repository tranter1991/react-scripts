'use strict';

const modules = require('../modules');
const paths = require('../paths');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const path = require('path');
const fs = require('fs');

module.exports = function (handler, options) {
  handler.config((webpackConfig) => {
    // mode
    // bail
    // devtool
    // entry
    // output
    // resolve

    const {
      isEnvProduction, isEnvDevelopment, shouldUseSourceMap, appConfig
    } = options;

    const useTypeScript = fs.existsSync(paths.appTsConfig);

    const publicPath = isEnvProduction
      ? paths.servedPath
      : isEnvDevelopment && '/';

    webpackConfig
      .mode(isEnvProduction ? 'production' : isEnvDevelopment && 'development')
      .bail(isEnvProduction)
      .devtool(
        isEnvProduction
          ? shouldUseSourceMap
            ? 'source-map'
            : false
          : isEnvDevelopment && 'cheap-module-source-map'
      );

    const entrys = [
      // Include an alternative client for WebpackDevServer. A client's job is to
      // connect to WebpackDevServer by a socket and get notified about changes.
      // When you save a file, the client will either apply hot updates (in case
      // of CSS changes), or refresh the page (in case of JS changes). When you
      // make a syntax error, this client will display a syntax error overlay.
      // Note: instead of the default WebpackDevServer client, we use a custom one
      // to bring better experience for Create React App users. You can replace
      // the line below with these two lines if you prefer the stock client:
      // require.resolve('webpack-dev-server/client') + '?/',
      // require.resolve('webpack/hot/dev-server'),
      isEnvDevelopment
        && require.resolve('react-dev-utils/webpackHotDevClient'),
      // Finally, this is your app's code:
      paths.appIndexJs
      // We include the app code last so that if there is a runtime error during
      // initialization, it doesn't blow up the WebpackDevServer client, and
      // changing JS code would still trigger a refresh.
    ].filter(Boolean);

    const entry = webpackConfig.entry('app');
    entrys.forEach((i) => {
      entry.add(i);
    });

    // 开发环境启动react-react-loader
    if (isEnvDevelopment && appConfig.enableReactHotLoader) {
      entry.prepend(require.resolve('react-hot-loader/patch'))
        .end()
        .resolve.alias.set('react-dom', '@hot-loader/react-dom');
    }

    webpackConfig.output
      .path(isEnvProduction ? paths.appBuild : undefined)
      .pathinfo(isEnvDevelopment)
      .filename(
        isEnvProduction
          ? 'static/js/[name].[contenthash:8].js'
          : isEnvDevelopment && 'static/js/bundle.js'
      )
      // .futureEmitAssets()
      .chunkFilename(
        isEnvProduction
          ? 'static/js/[name].[contenthash:8].chunk.js'
          : isEnvDevelopment && 'static/js/[name].chunk.js'
      )

      .publicPath(publicPath)
      .devtoolModuleFilenameTemplate(
        isEnvProduction
          ? (info) => path
            .relative(paths.appSrc, info.absoluteResourcePath)
            .replace(/\\/g, '/')
          : isEnvDevelopment
              && ((info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'))
      );

    // This allows you to set a fallback for where Webpack should look for modules.
    // We placed these paths second because we want `node_modules` to "win"
    // if there are any conflicts. This matches Node resolution mechanism.
    // https://github.com/facebook/create-react-app/issues/253
    ['node_modules', paths.appNodeModules]
      .concat(modules.additionalModulePaths || [])
      .forEach((module) => {
        webpackConfig.resolve.modules.add(module);
      });

    paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes('ts'))
      .forEach((ex) => {
        webpackConfig.resolve.extensions.add(ex);
      });

    webpackConfig.resolve.alias.set('react-native', 'react-native-web');

    webpackConfig.resolve.plugin('pnp').use(PnpWebpackPlugin);

    webpackConfig.resolve
      .plugin('module_scope')
      .use(ModuleScopePlugin, [paths.appSrc, [paths.appPackageJson]]);

    webpackConfig.resolveLoader
      .plugin('pnp')
      .use(PnpWebpackPlugin.moduleLoader(module));

    webpackConfig.node.merge({
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      http2: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    });

    webpackConfig.performance.hints(false);
  });
};
