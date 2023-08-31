/**
 * Webpack configuration modelled after https://docs.nestjs.com/faq/serverless
 */

const CopyWebpackPlugin = require('copy-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (options, webpack) {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/mapped-types',
    'class-transformer/storage',
    'cache-manager',
    'class-validator',
    'class-transformer',
  ];

  return {
    ...options,
    entry: {
      'src/lambdas/batch-reconcile': './src/lambdas/batch-reconcile.ts',
      'src/lambdas/dailyfilecheck': './src/lambdas/dailyfilecheck.ts',
      'src/lambdas/parser': './src/lambdas/parser.ts',
      'src/lambdas/reconcile': './src/lambdas/reconcile.ts',
      'src/lambdas/report': './src/lambdas/report.ts',
      'src/database/migrate': './src/database/migrate.ts',
      'src/lambda': './src/lambda.ts',
      'src/database/datasource': './src/database/datasource.ts',
      'src/database/migrations/1693436330368-migration.ts':
        './src/database/migrations/1693436330368-migration',
    },
    target: 'node',
    mode: 'production',
    devtool: 'source-map',
    externals: [],
    optimization: {
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: '/[\\/]node_modules[\\/]/',
            name: 'vendors',
          },
        },
      },
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: false,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    output: {
      ...options.output,
      filename: '[name].js',
      chunkFilename: '[id].dependencies.js',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      ...options.plugins,
      new CopyWebpackPlugin({
        patterns: [
          '../../node_modules/swagger-ui-dist/swagger-ui.css',
          '../../node_modules/swagger-ui-dist/swagger-ui-bundle.js',
          '../../node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js',
          '../../node_modules/swagger-ui-dist/favicon-16x16.png',
          '../../node_modules/swagger-ui-dist/favicon-32x32.png',
        ],
      }),
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (/^pg-native$/.test(resource)) {
            return true;
          }

          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
