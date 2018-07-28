from flask import (
	jsonify, request
)

import pandas as pd

from app.db import getDB, queryDB

from app.models import geneExprSerialize

from app import app


@app.route('/api/cpm', methods=['GET'])
def cpm():
	'''Gets all expression data of input gene'''
	# db = getDB()

	query = request.args['q']


	tissues = ["AOR", "MAM", "VAF", "SF", "Blood", "LIV", "SKLM", "FC", "MP"]

	expr = []  # list of results, one per tissue assumed
	for tis in tissues:
		# SQL query in tissue-specific gene expression table based on symbol
		sql = "SELECT * FROM cpm_%s WHERE ensembl_base = ?" %tis

		results = queryDB(sql, [query])

		if len(results) > 0:
			# parse SQL row to dictionary
			expr.append(geneExprSerialize(results[0]))

	return jsonify(expr)


@app.route('/api/in-module', methods=['GET'])
def inmodule():
	'''
	Which co-expression modules is a gene found in?
	Returns module statistics.
	'''
	db = getDB()

	query = request.args['q']  # ensembl ID to query

	sql_ensembl = "SELECT * FROM modules WHERE ensembl = ?"

	# Read found entries into pandas data frame
	df = pd.read_sql_query(sql_ensembl, db, params=[query])

	identified_modules = df['clust'].tolist()
	gene_tissue = df['tissue'].tolist()  # input gene tissue of origin, in found modules

	# Inner function for counting tissues of module
	def countTissues(k, db):
		sql_module_tissue = "SELECT tissue FROM modules WHERE clust = ?"

		df = pd.read_sql_query(sql_module_tissue, db, params=[k])

		counts = df['tissue'].value_counts().to_dict()

		return counts

	# list comprehension, applying countTissues() to module ids
	tissue_counts = [countTissues(k, db) for k in identified_modules]

	# Combine and format results
	message = []
	for i in range(len(identified_modules)):
		message.append({
			'module': identified_modules[i],
			'tissue_counts': tissue_counts[i],
			'gene_tissue': gene_tissue[i]
		})

	return jsonify(message)


@app.route('/api/deg', methods=['GET'])
def deg():
	'''
	Gets differental statistics of ensembl ID. In table format.
	'''
	db = getDB()

	query = request.args['q']

	sql = "SELECT * FROM deg WHERE ensembl = ?"

	df = pd.read_sql_query(sql, db, params=[query])

	# filter columns
	df = df[['tissue', 'ensembl', 'hgnc_symbol', 'baseMean', 'log2FoldChange', 'pvalue', 'padj']]

	return jsonify(df.to_dict(orient='records'))
