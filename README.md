## react-scripts

fork create-react-app/packages/react-scripts@3.0.1

<https://github.com/facebook/create-react-app>

### 特性

1. 常用打包配置
2. 支持自定义常用配置
3. 原有eslint配置调整为 eslint-config-lfe
4. 原有sass改为less写样式文件

#### 常用打包配置

1. 支持config包多环境加载配置
2. 打包输出路径为target/{projectName}/

#### 支持自定义配置

需要创建app.config.js文件在项目根目录

配置项:

| 配置项                    | 说明                                                         | 默认值                                                       |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| define                    | 注入对象到webpack.DefinePlugin插件中                         | {}                                                           |
| appBuild                  | 打包输出路径                                                 | target/${packageJson.name}                                   |
| appPublic                 | 静态文件路径                                                 | static                                                       |
| appHtml                   | HtmlWebpackPlugin插件template路径                            | static/index.html                                            |
| appIndexJs                | webpack打包入口文件                                          | src/index                                                    |
| servedPath                | production时输出静态文件域名                                 | ''                                                           |
| publicUrl                 | 打包时输出静态文件路径,production时优先使用servedPath, 只publicUrl也可以 | ''                                                           |
| eslintLoader              | 启用eslintLoading                                            | false                                                        |
| ignoreTSError             | ForkTsCheckerWebpackPlugin插件中ignoreDiagnostics配置        | []                                                           |
| webpackDevProxy           | 暂时没用                                                     | -                                                            |
| modifyVars                | less配置中options.modifyVars                                 | {}                                                           |
| webpack                   | 使用[webpackChain](<https://github.com/neutrinojs/webpack-chain>)覆盖配置格式为:<br />function(webpackConfig, isBuild, options){<br />webpackConfig.entry('app').xxxx<br />}<br /><br />webpackConfig: webpackChain对象<br />isBuild:是否执行的是npm run build<br />options: 当前配置 | null                                                         |
| proxy                     | WebpackDevServer配置中proxy配置                              | null                                                         |
| enableReactHotLoader      | 是否启动react-hot-loader babel                               | react-hot-loader babel配置是否启用, 包括 @hot-loader配置 默认: false,  <br />使用说明: <https://github.com/gaearon/react-hot-loader> |
| enablePostcssPXToRem      | 是否启用PostcssPXToRem插件                                   | 默认: false                                                  |
| postcssPXToRemArgs        | postcssPXToRem插件参数                                       | 默认: <br />rootValue: 100, propWhiteList: []                |
| enablePostcssPXToViewport | 是否启用postcssPXToViewport插件                              | 默认: false                                                  |
| postcssPXToViewportArgs   | postcssPXToViewport插件参数                                  | 默认: 375配置, 详见源代码                                    |

#### webpackBundleAnalyzerPlugin使用
```
EN_ANALYZER=true && npm run build
```

#### webpack自定义配置实例

项目中目前自定义的配置, 使用到的地方可以在此共享展示, 后续可以把通用的配置集成到脚手架中

**demo**

```javascript
    if (!isBuild) {
      // 增加react-hot-loader
      webpackConfig
        .entry('app')
        .prepend(require.resolve('react-hot-loader/patch'))
        .end()
        .resolve.alias.set('react-dom', '@hot-loader/react-dom');
    } else {
      // 输出静态文件去掉hash指纹
      webpackConfig.output
        .filename('static/js/[name].js')
        .chunkFilename('static/js/[name].chunk.js');
      webpackConfig.plugin('miniCssExtractPlugin').tap(() => [
        {
          filename: 'static/css/[name].css',
          chunkFilename: 'static/css/[name].chunk.css',
        },
      ]);
    }
		// 增加antd icon 按需加载
    webpackConfig.resolve.alias.set(
      '@ant-design/icons/lib/dist$',
      path.resolve(process.cwd(), './src/common/icons.ts')
    );
		// 增加analyzer插件
    if (process.env.EN_ANALYZER === 'true') {
      webpackConfig
        .plugin('bundleAnalyzer')
        .use(BundleAnalyzerPlugin.BundleAnalyzerPlugin);
    }
```

**demo**

```javascript
    if (!isBuild) {
      // 增加react-hot-loader
      webpackConfig
        .entry('app')
        .prepend(require.resolve('react-hot-loader/patch'))
        .end()
        .resolve.alias.set('react-dom', '@hot-loader/react-dom');
    }

    // 增加postcss to vw插件
    const lessUses = webpackConfig.module.rule('compile').oneOf('less').uses;
    lessUses.values().forEach((use) => {
      use
        .tap((args) => {
          if (args && args.ident === 'postcss') {
            return Object.assign(args, {
              plugins: [
                require('postcss-px-to-viewport')({
                  viewportWidth: 375, // 设计稿宽度
                  viewportHeight: 667, // 设计稿高度，可以不指定
                  unitPrecision: 3, // px to vw无法整除时，保留几位小数
                  viewportUnit: 'vw', // 转换成vw单位
                  selectorBlackList: ['.ignore', '.hairlines'], // 不转换的类名
                  minPixelValue: 1, // 小于1px不转换
                  mediaQuery: false, // 允许媒体查询中转换
                }),
              ],
            });
          }
          return args;
        })
        .end();
    });
```


