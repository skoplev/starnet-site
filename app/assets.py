from . import app  # app context

import os

from flask import Flask
from flask_assets import Bundle, Environment

assets = Environment(app)

# add bower directory to allow custom installs
# assets.load_path = ['bower_components', 'app/static']
assets.load_path = ['app/static']
# raise Exception("cdw: " + os.getcwd())

# Define bundles of js code to be minfied
bundles = {
	'js_gene': Bundle(
		'js/gene.js',
		'js/table.js',  # functions for rending table
		filters='jsmin',
		output='gen/gene.min.js'
	),
	'js_variant': Bundle(
		'js/variant.js',
		'js/table.js',
		filters='jsmin',
		output='gen/variant.min.js'
	)
}

assets.register(bundles)
