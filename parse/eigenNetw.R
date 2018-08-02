# Based on the bayesNet2.R environment containing the network data.
# Rscript parse/eigenNetw.R

rm(list=ls())

library(rjson)
library(igraph)
library(data.table)

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

# write.csv(lay_json, "app/static/data/sugiyama_layout.csv")
# writeToJSON(lay_json, "app/static/data/sugiyama_layout.json")

edges = as_edgelist(g)

# toJSON(unname(split(edges, 1:nrow(edges))))
# writeToJSON(edges, "app/static/data/edges.json")

# combine annotations for the supernetwork json file
annot = pheno_pval

# primary tissue or cross-tissue labels
tissues = c("AOR", "BLOOD", "LIV", "MAM", "SKLM", "SF", "VAF")
annot$tissue = tissues[apply(data.frame(mod_tab)[, tissues], 1, which.max)]
annot$tissue[mod_tab$purity < 0.95]  = "Cross-tissue"

# Write as combined json file
cat(
	toJSON(
		list(
			layout=unname(split(lay_json, 1:nrow(lay_json))),
			edges=unname(split(edges, 1:nrow(edges))),
			nodes=as.character(as.vector(V(g))),
			annot=unname(split(annot, 1:nrow(annot)))
		)
	),
	file="app/static/data/eigen_network.json"
)
