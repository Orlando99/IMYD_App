'use strict';

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var srcPath = path.join(__dirname, '../src');
var distPath = path.join(__dirname, '../dist');

module.exports = {
	devtool: 'source-map',
	entry: [
		path.join(srcPath, '/app/index.js')
	],
	output: {
		path: distPath,
		filename: 'bundle.js'
	},
	plugins: [
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
			'window.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
		}),
		new ExtractTextPlugin('/css/styles.css'),
		new CopyWebpackPlugin([
			{ from: path.join(srcPath, '/index.html') , to: path.join(distPath, '/index.html') },
			{ from: path.join(srcPath, '/miscellaneous/modernizr-custom.js') , to: path.join(distPath, '/lib/modernizr-custom.js') },
			{ from: path.join(srcPath, '/miscellaneous/jspdf.min.js') , to: path.join(distPath, '/lib/jspdf.min.js') },
			{ from: path.join(srcPath, '/images') , to: path.join(distPath, '/images') },
			{ from: path.join(srcPath, '/audio') , to: path.join(distPath, '/audio') }
		])
	],
	module: {
		loaders: [
			{
				test: /\.js?$/,
				exclude: /node_modules/,
				loader: 'babel'
			},
			{
				test: /\.json?$/,
				loader: 'json-loader'
			},
			{
				test: /\.css?$/,
				loader: ExtractTextPlugin.extract('css-loader')
			},
			{ test: /\.styl$/,
				loader: ExtractTextPlugin.extract('css-loader!stylus-loader')
			},
			{ test: /\.(jpe?g|png|gif|ico)$/,
				loader: 'url',
				query: {
					limit: 10000,
					name: '/images/[name].[ext]'
				}
			},
			{
				test: /\.(svg|eot|ttf|woff|woff2|otf)$/,
				loader: 'url-loader',
				query: {
					limit: 10000,
					name: '/fonts/[name].[ext]'
				}
			},
			{
				test: /\.(mp3)$/,
				loader: 'url-loader',
				query: {
					limit: 10000,
					name: '/audio/[name].[ext]'
				}
			}
		]
	}
};