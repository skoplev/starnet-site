from flask import Flask
import os

# from flask_sqlalchemy import SQLAlchemy

# Minimal test app for testing Apache web server
app = Flask(__name__)

@app.route("/")
def hello():
	return "Test App 2!"
