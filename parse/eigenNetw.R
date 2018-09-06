# Based on the bayesNet2.R environment containing the network data.
# Rscript parse/eigenNetw.R

rm(list=ls())

library(rjson)
library(igraph)
library(data.table)
library(plyr)

setwd("~/Dev/STARNET-site")
source("parse/lib/parse.R")

# Load supernetwork environment
load("~/GoogleDrive/projects/STARNET/cross-tissue/co-expression/eigenNetw/Rworkspace/bayesNet2.RData")

# setwd("~/Dev/STARNET-site")

# Load module annotations
mod_tab = fread("~/GoogleDrive/projects/STARNET/cross-tissue/co-expression/tables/module_tab.csv")
pheno_pval = fread("~/GoogleDrive/projects/STARNET/cross-tissue/pheno/tables/pheno_pval.csv")

# writes dataframe to json file
writeToJSON = function(df, file) {
	cat(
		# writes to file
		toJSON(
			unname(
				# one data frame per row, carrying over the column ids
				split(df, 1:nrow(df))
			)
		),
		file=file
	)
	return(1)
}


# Write layout to .csv and .json file
lay_json = lay
colnames(lay_json) = c('x', 'y')


lay_json = data.frame(module=1:nrow(lay_json), lay_json)

# trim coordinates of layout
margin = 1
lay_json$x = lay_json$x - min(lay_json$x) + margin
lay_json$y = lay_json$y - min(lay_json$y) + margin

# write.csv(lay_json, "app/static/data/sugiyama_layout.csv")
# writeToJSON(lay_json, "app/static/data/sugiyama_layout.json")

edges = as_edgelist(g)

# toJSON(unname(split(edges, 1:nrow(edges))))
# writeToJSON(edges, "app/static/data/edges.json")



# primary tissue or cross-tissue labels
tissues = c("AOR", "BLOOD", "LIV", "MAM", "SKLM", "SF", "VAF")
annot = data.frame(
	Tissue=tissues[apply(data.frame(mod_tab)[, tissues], 1, which.max)],
	stringsAsFactors=FALSE
)

# annot$Tissue = tissues[apply(data.frame(mod_tab)[, tissues], 1, which.max)]
annot$Tissue[mod_tab$purity < 0.95]  = "Cross-tissue"

annot["Secreted proteins"] = mod_tab$secreted_protein_pval

# GWAS enrichments
gwas_pvals = mod_tab[, c(
		'CAD_pval',
		'Myocardial infarction_pval',
		'Type 2 diabetes_pval',
		# 'Lipid metabolism phenotypes_pval',
		'LDL cholesterol_pval',
		'HDL cholesterol_pval',
		'Cholesterol, total_pval',
		'Waist-to-hip ratio adjusted for body mass index_pval',
		# 'Glucose homeostasis traits_pval',
		'Body mass index_pval',
		'Systolic blood pressure_pval',
		'Diastolic blood pressure_pval',
		'Hypertension_pval'
	)
]

colnames(gwas_pvals) = sapply(strsplit(colnames(gwas_pvals), "_"), function(x) x[1])

gwas_pvals = rename(gwas_pvals, c(
		"Waist-to-hip ratio adjusted for body mass index"="Waist-to-hip ratio adjusted for BMI"
		# "Body mass index"="BMI"
	)
)

# combine annotations for the supernetwork json file
annot = cbind(annot, pheno_pval, gwas_pvals)

# Renane columns
annot = renameAnnot(annot)

# Write as combined json file
cat(
	toJSON(
		list(
			layout=unname(split(lay_json, 1:nrow(lay_json))),
			edges=unname(split(edges, 1:nrow(edges))),
			nodes=as.character(as.vector(V(g))),
			annot=unname(split(annot, 1:nrow(annot))),
			mod_size=mod_tab$mod_size
		)
	),
	file="app/static/data/eigen_network.json"
)
