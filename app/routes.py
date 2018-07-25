from flask import (
	render_template, request, redirect, url_for, g
)

from app.db import getDB, queryDB, closeDB

from app import app  # required

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

	db = getDB()

	cur = db.cursor()

	sql = "INSERT INTO cpm (id, data) VALUES (?, ?)"
	entry = ("ENSG101101010", "1.0,2.0")
	cur.execute(sql, entry)
	# cur.execute("INSERT INTO cpm (id, data) VALUES ('ENSG001001', '[1.0, 2.0, 1.3]')")
	# cur.execute("INSERT INTO cpm (id, data) VALUES ('ENSG001001', '1.2')")
	cur.close()
	# closeDB()
	db.commit()

	# db = getDB()
	for entry in queryDB("select * from cpm"):
		print(entry["id"], ": ", entry["data"])



	query = request.args['q']

	# Redirect to page
	if request.args['type'] == "Gene":
		return redirect(url_for("gene", symbol=query))
	elif request.args['type'] == "SNP":
		return redirect(url_for("variant", snp_id=query))
	else:
		warnings.warn("Unrecognized GET type")
