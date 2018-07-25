import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy


def createApp(test_config=None):
	# create and configure the app
	app = Flask(__name__, instance_relative_config=True)
	app.config.from_mapping(
		SECRET_KEY="dev",
		DATABASE=os.path.join(app.instance_path, "flaskr.sqlite")
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

	return app


# Init flask application
app = createApp()

db = SQLAlchemy()


from app.models import ExpressionCPM
x = ExpressionCPM(ensembl_id="ENSG00000000", data=[1.0, 2.0, 3.0])


# sci_db = connect("http://localhost:5001")


from app import routes
