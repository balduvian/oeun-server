import path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
	mode: 'development',
	entry: {
		index: './src/app.tsx',
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /.svg$/,
				loader: 'svg-inline-loader',
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	target: ['web', 'es2020'],
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '../run/page'),
	},
};

export default config;
