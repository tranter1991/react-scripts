'use strict';

const paths = require('../paths');

const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');
const postcssNormalize = require('postcss-normalize');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

module.exports = function (handler, options) {
  const {
    isEnvProduction,
    isEnvDevelopment,
    shouldUseSourceMap,
    appConfig,
  } = options;

  const publicPath = isEnvProduction
    ? paths.servedPath
    : isEnvDevelopment && '/';

  // Some apps do not use client-side routing with pushState.
  // For these, "homepage" can be set to "." to enable relative asset paths.
  const shouldUseRelativeAssetPaths = publicPath === './';

  handler.config((webpackConfig) => {
    // common function to get style loaders
    const getStyleLoaders = (cssOptions, preProcessor) => {
      const loaders = [
        isEnvDevelopment && {
          loader: require.resolve('style-loader'),
        },
        isEnvProduction && {
          loader: MiniCssExtractPlugin.loader,
          options: shouldUseRelativeAssetPaths
            ? { publicPath: '../../' }
            : {},
        },
        {
          loader: require.resolve('css-loader'),
          options: cssOptions,
        },
        {
          // Options for PostCSS as we reference these options twice
          // Adds vendor prefixing based on your specified browser support in
          // package.json
          loader: require.resolve('postcss-loader'),
          options: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            plugins: () => [
              require('postcss-flexbugs-fixes'),
              require('postcss-preset-env')({
                autoprefixer: {
                  flexbox: 'no-2009',
                },
                stage: 3,
              }),
              appConfig.enablePostcssPXToRem && require('postcss-pxtorem')(appConfig.postcssPXToRemArgs),
              appConfig.enablePostcssPXToViewport && require('postcss-px-to-viewport')(appConfig.postcssPXToViewportArgs),
              // Adds PostCSS Normalize as the reset css with default options,
              // so that it honors browserslist config in package.json
              // which in turn let's users customize the target behavior as per their needs.
              postcssNormalize(),
            ].filter(Boolean),
            sourceMap: isEnvProduction && shouldUseSourceMap,
          },
        },
      ].filter(Boolean);
      if (preProcessor) {
        loaders.push({
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: isEnvProduction && shouldUseSourceMap,
            javascriptEnabled: true,
            modifyVars: appConfig.modifyVars || {},
          },
        });
      }

      return loaders;
    };

    const babelLoaderOptions = {
      customize: require.resolve('babel-preset-react-app/webpack-overrides'),
      // TODO 注释掉这块是因为禁用了外部babel修改
      // @remove-on-eject-begin
      // babelrc: false,
      // configFile: false,
      presets: [require.resolve('babel-preset-react-app')],
      // // Make sure we have a unique cache identifier, erring on the
      // // side of caution.
      // // We remove this when the user ejects because the default
      // // is sane and uses Babel options. Instead of options, we use
      // // the react-scripts and babel-preset-react-app versions.
      // cacheIdentifier: getCacheIdentifier(
      //   isEnvProduction ? 'production' : isEnvDevelopment && 'development',
      //   [
      //     'babel-plugin-named-asset-import',
      //     'babel-preset-react-app',
      //     'react-dev-utils',
      //     'react-scripts',
      //   ]
      // ),
      // // @remove-on-eject-end
      plugins: [
        [
          require.resolve('babel-plugin-named-asset-import'),
          {
            loaderMap: {
              svg: {
                ReactComponent: '@svgr/webpack?-svgo,+ref![path]',
              },
            },
          },
        ],
      ],
      // This is a feature of `babel-loader` for webpack (not Babel itself).
      // It enables caching results in ./node_modules/.cache/babel-loader/
      // directory for faster rebuilds.
      cacheDirectory: true,
      cacheCompression: isEnvProduction,
      compact: isEnvProduction,
    };

    const outScriptOptions = {
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [
        [
          require.resolve('babel-preset-react-app/dependencies'),
          { helpers: true },
        ],
      ],
      cacheDirectory: true,
      cacheCompression: isEnvProduction,
      // @remove-on-eject-begin
      cacheIdentifier: getCacheIdentifier(
        isEnvProduction ? 'production' : isEnvDevelopment && 'development',
        [
          'babel-plugin-named-asset-import',
          'babel-preset-react-app',
          'react-dev-utils',
          'react-scripts',
        ]
      ),
      // @remove-on-eject-end
      // If an error happens in a package, it's possible to be
      // because it was compiled. Thus, we don't want the browser
      // debugger to show the original code. Instead, the code
      // being evaluated would be much more helpful.
      sourceMaps: false,
    };

    const cssLoaders = getStyleLoaders({
      importLoaders: 1,
      sourceMap: isEnvProduction && shouldUseSourceMap,
    });

    const cssModuleLoaders = getStyleLoaders({
      importLoaders: 1,
      sourceMap: isEnvProduction && shouldUseSourceMap,
      modules: true,
      getLocalIdent: getCSSModuleLocalIdent,
    });

    const lessLoaders = getStyleLoaders(
      {
        importLoaders: 2,
        sourceMap: isEnvProduction && shouldUseSourceMap,
      },
      'less-loader'
    );

    const cssRegex = /\.css$/;
    const cssModuleRegex = /\.module\.css$/;
    const lessRegex = /\.less$/;
    const lessModuleRegex = /\.module\.less$/;

    // webpackConfig.module.strictExportPresence(true);
    webpackConfig.module.rule('parser').parser({ requireEnsure: false });

    const rules = webpackConfig.module.rule('compile');

    rules
      .oneOf('url')
      .test([/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/])
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      })
      .end()
      .end()
      .oneOf('script')
      .include.add(paths.appSrc)
      .end()
      .test(/\.(js|mjs|jsx|ts|tsx)$/)
      .use('babel-loader')
      .loader('babel-loader')
      .options(babelLoaderOptions)
      .end()
      .end()
      .oneOf('outsideScript')
      .exclude.add(/@babel(?:\/|\\{1,2})runtime/)
      .end()
      .test(/\.(js|mjs)$/)
      .use('babel-loader')
      .loader('babel-loader')
      .options(outScriptOptions)
      .end()
      .end();

    const cssRule = rules
      .oneOf('css')
      .sideEffects(true)
      .test(cssRegex)
      .exclude.add(cssModuleRegex)
      .end();

    const cssModuleRule = rules
      .oneOf('cssModule')
      .sideEffects(true)
      .exclude.add(cssRegex)
      .end()
      .test(cssModuleRegex);

    const lessRule = rules
      .oneOf('less')
      .sideEffects(true)
      .test(lessRegex)
      .exclude.add(lessModuleRegex)
      .end();

    const useCssLoaders = (rule, loaders) => {
      loaders.forEach((loader) => {
        rule
          .use(loader.loader)
          .loader(loader.loader)
          .options(loader.options)
          .end();
      });
    };

    useCssLoaders(cssRule, cssLoaders);
    useCssLoaders(cssModuleRule, cssModuleLoaders);
    useCssLoaders(lessRule, lessLoaders);

    rules
      .oneOf('file')
      .exclude.add([/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/])
      .end()
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'static/media/[name].[hash:8].[ext]',
      })
      .end()
      .end();
  });
};
