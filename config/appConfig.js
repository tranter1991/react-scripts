'use strict';

const fs = require('fs-extra');
const path = require('path');
const ChainConfig = require('webpack-chain');

// app 当前路径
const appDirectory = fs.realpathSync(process.cwd());

// app路径下获取全路径
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

// 是否存在config npm 如果存在则优先加载
const hasConfigModel = fs.existsSync(resolveApp('node_modules/config'));
if (hasConfigModel) {
  require('config');
}
// 读取package.json
const packageJson = require(resolveApp('./package.json'));

// 默认配置
const defaultConfig = {
  define: {},
  appBuild: `target/${packageJson.name}`,
  appPublic: 'public',
  appHtml: 'public/index.html',
  appIndexJs: 'src/index',
  servedPath: '',
  publicUrl: '',
  eslintLoader: false,
  ignoreTSError: [],
  webpackDevProxy: false,
  modifyVars: {},
  webpack: null,
  proxy: {},
  enableReactHotLoader: false,
  enablePostcssPXToRem: false,
  postcssPXToRemArgs: {
    rootValue: 100, propWhiteList: [],
  },
  enablePostcssPXToViewport: false,
  postcssPXToViewportArgs: {
    viewportWidth: 375, // 设计稿宽度
    viewportHeight: 667, // 设计稿高度，可以不指定
    unitPrecision: 3, // px to vw无法整除时，保留几位小数
    viewportUnit: 'vw', // 转换成vw单位
    selectorBlackList: ['.ignore', '.hairlines'], // 不转换的类名
    minPixelValue: 1, // 小于1px不转换
    mediaQuery: false, // 允许媒体查询中转换
  },
};

/**
 * 合并基础配置
 */
function margeBaseConfig() {
  // 项目自定义配置文件路径
  const appConfigPath = resolveApp('./app.config.js');
  let appConfig;
  if (fs.existsSync(appConfigPath)) {
    appConfig = require(appConfigPath);
    // 首先覆盖设置
    if (appConfig) {
      Object.assign(defaultConfig, appConfig);
    }
  }
}

/**
 * 返回webpack config object
 * @param {*} webpackConfig
 * @param {*} isBuild
 */
function toConfig(webpackEnv, isBuild) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  const chainConfig = new ChainConfig();
  const options = {
    isEnvProduction,
    isEnvDevelopment,
    shouldUseSourceMap: process.env.GENERATE_SOURCEMAP === 'true',
    appConfig: defaultConfig
  };

  // 读取配置
  // https://github.com/facebook/create-react-app/blob/v3.0.1/packages/react-scripts/config/webpack.config.js
  ['base', 'module', 'plugins', 'optimization'].forEach((filename) => {
    const configModule = require(`./webpack/${filename}`);
    configModule(
      {
        config(cb) {
          cb(chainConfig);
        },
      },
      options
    );
  });

  const customWebpackConfig = defaultConfig.webpack;
  if (typeof customWebpackConfig === 'function') {
    customWebpackConfig(chainConfig, isBuild, options);
  } else if (customWebpackConfig && typeof customWebpackConfig === 'object') {
    chainConfig.merge(customWebpackConfig);
  }

  return chainConfig.toConfig();
}

module.exports = {
  appConfig: defaultConfig,
  toConfig,
  margeBaseConfig,
};
