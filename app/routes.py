from flask import (
	render_template, request, redirect, url_for, g, abort
)

from app.db import getDB, queryDB, closeDB

from app import app  # required

import warnings

@app.route('/')
@app.route('/index')
def index():
	return render_template("index.html")

# Gene page
@app.route('/gene/<ensembl>')
def gene(ensembl):

	# find ensembl annotation
	sql = "SELECT * FROM ensembl WHERE ensembl_gene_id = ?"
	results = queryDB(sql, [ensembl])

	if len(results) == 0:
		abort(404)  # not found

	return render_template('gene.html',
		ensembl=ensembl,
		symbol=results[0]['hgnc_symbol'],
		description=results[0]['description'].split(" [")[0],
		gene_biotype=results[0]['gene_biotype'],
		chromosome=results[0]['chromosome_name'],
		start_position=results[0]['start_position'],
		end_position=results[0]['end_position'],
		strand=results[0]['strand'],
		uniprot=results[0]['uniprot_gn']
	)

# SNP variant page
@app.route('/variant/<snp_id>')
def variant(snp_id):
	return render_template('variant.html', snp_id=snp_id)

# Module page
@app.route('/module/<mod_id>')
def module(mod_id):
	return render_template('module.html', mod_id=mod_id)


@app.route('/search', methods=['GET'])
def search():

	query = request.args['gene_snp_query']

	db = getDB()

	# Redirect to page
	if request.args['type'] == "Gene":
		query = query.upper()

		if query[0:4] == "ENSG":
			# assume ENSEMBL ID
			ensembl_id = query
		else:
			# query ensembl data for HGNC symbol
			sql = "SELECT * FROM ensembl WHERE hgnc_symbol = ?"

			results = queryDB(sql, [query])

			if len(results) == 0:
				abort(404)  # not found

			ensembl_id = results[0]['ensembl_gene_id']

		return redirect(url_for("gene", ensembl=ensembl_id))

	elif request.args['type'] == "SNP":
		query = query.lower()
		return redirect(url_for("variant", snp_id=query))
	else:
		warnings.warn("Unrecognized GET type")

@app.route("/enrichment-results", methods=['POST'])
def enrichmentResults():
	print request.form
	query = request.form['gene_snp_list'].split()  # split by whitespace

	return "Gene set enrichment results for: " + ' '.join(query)

@app.route("/eqtl-results", methods=['POST'])
def eqtlResults():
	query = request.form['gene_snp_list'].split()  # split by whitespace

	return "eQTL results"