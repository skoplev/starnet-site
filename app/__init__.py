
import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy


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

	return app



# Init flask application
app = createApp()
# from app import db
from app import routes
from app import api


# db = SQLAlchemy()

# from app.models import ExpressionCPM
# x = ExpressionCPM(ensembl_id="ENSG00000000", data=[1.0, 2.0, 3.0])
