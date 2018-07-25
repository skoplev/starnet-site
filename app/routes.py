from flask import render_template, request, redirect, url_for
from app import app

import warnings

@app.route('/')
@app.route('/index')
def index():
	return render_template("index.html")

# Gene page
@app.route('/gene/<symbol>')
def gene(symbol):
	return render_template('gene.html', symbol=symbol)

# SNP variant page
@app.route('/variant/<snp_id>')
def variant(snp_id):
	return render_template('variant.html', snp_id=snp_id)


@app.route('/search', methods=['GET'])
def search():
	query = request.args['q']

	# Redirect to page
	if request.args['type'] == "Gene":
		return redirect(url_for("gene", symbol=query))
	elif request.args['type'] == "SNP":
		return redirect(url_for("variant", snp_id=query))
	else:
		warnings.warn("Unrecognized GET type")
