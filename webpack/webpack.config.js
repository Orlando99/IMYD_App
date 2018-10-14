'use strict';

var path = require('path');
var webpack = require('webpack');
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
		new CopyWebpackPlugin([
			{ from: path.join(srcPath, '/index.html') , to: path.join(distPath, '/index.html') },
			{ from: path.join(srcPath, '/miscellaneous/styles-place-holder.css') , to: path.join(distPath, '/css/styles.css') }, // hacky solution for missing css file - todo: replace with html-webpack-plugin
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
				loaders: ['style-loader','css-loader']
			},
			{ test: /\.styl$/,
				loaders: ['style-loader','css-loader', 'stylus-loader']
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