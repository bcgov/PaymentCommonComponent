/**
 * Webpack configuration modelled after https://docs.nestjs.com/faq/serverless
 */
module.exports = function (options, webpack) {
    const lazyImports = [
        '@nestjs/microservices/microservices-module',
        '@nestjs/websockets',
        '@nestjs/websockets/socket-module',
        '@nestjs/mapped-types',
        'class-transformer/storage'
    ];

    return {
        ...options,
        entry: {
            'src/lambdas/batch-reconcile': './src/lambdas/batch-reconcile.ts',
            'src/lambdas/dailyfilecheck': './src/lambdas/dailyfilecheck.ts',
            'src/lambdas/parser': './src/lambdas/parser.ts',
            'src/lambdas/reconcile': './src/lambdas/reconcile.ts',
            'src/lambdas/report': './src/lambdas/report.ts',
        },
        target: 'node',
        mode: 'production',
        devtool: 'source-map',
        externals: [],
        optimization: {
            minimize: false,
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: '/[\\/]node_modules[\\/]/',
                        name: 'vendors',
                    }
                }
            }
        }, 
        output: {
            ...options.output,
            filename: '[name].js',
            chunkFilename: '[id].dependencies.js',
            libraryTarget: 'commonjs2'
        },
        plugins: [
            ...options.plugins,

            new webpack.IgnorePlugin({
                checkResource(resource) {
                  if(/^pg-native$/.test(resource)) {
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
              })        
        ]
    };
};