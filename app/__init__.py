# Initialization of server application

import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bower import Bower

def createApp(test_config=None):
	# create and configure the app
	app = Flask(__name__, instance_relative_config=True)
	app.config.from_mapping(
		SECRET_KEY="dev",
		DATABASE=os.path.join(app.instance_path, "STARNET.sqlite")  # file name of db
	)

	if test_config is None:
		# load the instance config, if it exists when not testing
		app.config.from_pyfile("config.py", silent=True)
	else:
		# load the test config 
		app.config.from_mapping(test_config)

	try:
		os.makedirs(app.instance_path)
	except OSError:
		pass

	# Data base
	from . import db
	db.initApp(app)

	Bower(app)  # use bower.static for paths, must be installeed in /app folder using bower

	return app


# Init flask application
app = createApp()

# Prepare js and css assets
from . import assets


# Load routes
from app import routes
from app import api

# db = SQLAlchemy()
