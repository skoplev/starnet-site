from flask import (
	render_template, request, redirect, url_for, g, abort, jsonify
)

import pandas as pd
import numpy as np
import scipy.stats, statsmodels.stats.multitest, json

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

	description = results[0]['description'] or ''  # defaults to empty string if null, avoids failure on .split()

	return render_template('gene.html',
		ensembl=ensembl,
		symbol=results[0]['hgnc_symbol'],
		description=description.split(" [")[0],
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
	# print request.form

	query = request.form['gene_snp_list'].split()  # split by whitespace

	# Load module table
	db = getDB()

	sql = "SELECT gene_symbol, clust FROM modules"
	gene_tab = pd.read_sql_query(sql, db)

	# unique gene symbols
	gene_universe = set(gene_tab['gene_symbol'])

	# number of co-expression modules. should be 224
	nmodules = max(gene_tab['clust'])

	# Calculate overlaps
	found_query_genes = set(query) & gene_universe

	# Init statistics for Hypergeometric test
	enrich = pd.DataFrame({
		'module': xrange(1, nmodules + 1)
	})

	# Hypergeometric test for each module
	# https://blog.alexlenail.me/understanding-and-implementing-the-hypergeometric-test-in-python-a7db688a7458
	for i, row in enrich.iterrows():
		k = row["module"]  # module ID

		# get gene symbols for module ID
		module_symbols = gene_tab.gene_symbol[gene_tab['clust'] == k]
		module_symbols = set(module_symbols)

		# Calculate overlap size
		overlap = found_query_genes & module_symbols
		k_overlap = len(overlap)
		M_universe = len(gene_universe)
		n_mod_size = len(module_symbols)
		N_input_genes = len(found_query_genes)

		# survival function, 1 - CDF
		hypergeom_pval = scipy.stats.hypergeom.sf(k_overlap - 1, M_universe, n_mod_size, N_input_genes)

		# Store variables
		enrich.at[i, "overlap"] = k_overlap
		enrich.at[i, "module_size"] = n_mod_size
		enrich.at[i, "p"] = hypergeom_pval
		enrich.at[i, "genes"] = ";".join(overlap)  # string of overlapping genes

	# Multiple hypothesis correction
	rej, pval_adj = statsmodels.stats.multitest.multipletests(enrich['p'], method='fdr_bh')[:2]
	enrich['FDR'] = pval_adj

	# sort by enrichment p-values
	enrich = enrich.sort_values("p")

	return render_template("enrichment.html",
		enrich=enrich.to_json(orient='records', double_precision=15),
		n_found=len(found_query_genes),
		n_input=len(query))

# Queries multiple SNPs
@app.route("/eqtl-results", methods=['POST'])
def eqtlResults():
	snps = request.form['gene_snp_list'].split()  # split by whitespace

	db = getDB()

	# comma-separated string of SNP ids
	snp_string = ", ".join("'{0}'".format(x) for x in snps)

	# sql query using IN
	sql = "SELECT * FROM eqtl WHERE `adj.p-value` < 0.05 AND (SNP IN (%s))" % (snp_string)

	eqtl = pd.read_sql_query(sql, db)

	eqtl = eqtl.sort_values("p-value")

	# Get modules->eQTL gene dictionary
	gene_dict = {}

	modules = eqtl.clust.dropna().unique()
	for mod in modules:
		gene_dict[int(mod)] = eqtl.gene[eqtl.clust == mod].unique().tolist()

	return render_template("eqtl-multi.html",
		snps=json.dumps(snps),
		eqtl=eqtl.to_json(orient='records', double_precision=15),
		eqtl_by_module=json.dumps(gene_dict)
	)
