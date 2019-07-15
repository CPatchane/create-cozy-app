'use strict'

const webpack = require('webpack')
const PostCSSAssetsPlugin = require('postcss-assets-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { WebpackPluginRamdisk } = require('webpack-plugin-ramdisk')
const paths = require('../utils/paths')

const {
  environment,
  isDebugMode,
  getCSSLoader,
  getFilename,
  getEnabledFlags
} = require('./webpack.vars')
const production = environment === 'production'

module.exports = {
  resolve: {
    modules: [paths.appSrc(), paths.appNodeModules()],
    extensions: ['.js', '.json', '.css'],
    // linked package will still be see as a node_modules package
    symlinks: false
  },
  bail: true,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|cozy-(bar|client-js))/,
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: 'node_modules/.cache/babel-loader/js',
          presets: [['cozy-app', { react: false }]]
        }
      },
      {
        test: /\.css$/,
        use: [
          getCSSLoader(),
          {
            loader: require.resolve('css-loader'),
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              ident: 'postcss',
              sourceMap: true,
              plugins: function() {
                return [
                  require('autoprefixer')({ browsers: ['last 2 versions'] })
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: require.resolve('file-loader'),
        options: {
          name: `[name].[ext]`
        }
      }
    ],
    noParse: [/localforage\/dist/]
  },
  plugins: [
    new WebpackPluginRamdisk({}),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: `${getFilename()}${production ? '.min' : ''}.css`,
      chunkFilename: `${getFilename()}${production ? '.[id].min' : ''}.css`
    }),
    new PostCSSAssetsPlugin({
      test: /\.css$/,
      log: isDebugMode,
      plugins: [
        require('css-mqpacker'),
        require('postcss-discard-duplicates'),
        require('postcss-discard-empty')
      ].concat(
        production
          ? require('csswring')({
              preservehacks: true,
              removeallcomments: true
            })
          : []
      )
    }),
    // use a hash as chunk id to avoid id changes of not changing chunk
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DefinePlugin({
      __ENABLED_FLAGS__: JSON.stringify(getEnabledFlags())
    })
  ]
}
