from flask import (
	jsonify, request, abort
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


@app.route('/api/module', methods=['GET'])
def getmodule():
	'''
	Get module data for kth module
	'''

	db = getDB()

	k = request.args['k']

	sql = "SELECT * FROM modules WHERE clust = ?"

	df = pd.read_sql_query(sql, db, params=[k])

	# Filter columns
	df = df[['tissue', 'ensembl', 'gene_symbol', 'clust']]

	return jsonify(df.to_dict(orient='records'))


@app.route('/api/go', methods=['GET'])
def getgo():
	# Check user input
	if request.args.get('k') is None:
		abort(400)
	k = request.args['k']  # kth module

	db = getDB()

	if request.args.get('subtree') is not None:
		# GO subtree
		go_subtree = request.args['subtree']

		sql = "SELECT * FROM go WHERE module = ? AND termOntology = ? AND bkgrTermSize < '1000'"
		df = pd.read_sql_query(sql, db, params=[k, go_subtree])
	else:
		# get all GO subtrees
		sql = "SELECT * FROM go WHERE module = ? AND bkgrTermSize < '1000'"
		df = pd.read_sql_query(sql, db, params=[k])

	return jsonify(df.to_dict(orient='records'))


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


@app.route('/api/eqtl', methods=['GET'])
def eqtl():
	'''
	Get input
	snp: rsxxx id
	gene: ensembl id
	'''

	db = getDB()

	# Get input, set sql column to query
	if request.args.get('gene') is not None:
		query = request.args['gene']
		sql = "SELECT * FROM eqtl WHERE gene = ?"
	elif request.args.get('snp') is not None:
		sql = "SELECT * FROM eqtl WHERE SNP = ?"
		query = request.args['snp']
	else:
		abort(400)  # bad request

	# execute query, collect as dataframe
	df = pd.read_sql_query(sql, db, params=[query])

	# Rename gene column to ensembl
	df = df.rename(columns={'gene': 'ensembl'})

	return jsonify(df.to_dict(orient='records'))
