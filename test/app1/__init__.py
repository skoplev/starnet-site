from flask import Flask

# Minimal test app for testing Apache web server
app = Flask(__name__)

@app.route("/")
def hello():
	return "Yo from Flask, test App1!"
