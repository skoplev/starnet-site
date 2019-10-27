# Loads and formats Bayesian networks inferred for each co-expression module

rm(list=ls())

library(data.table)
library(plyr)

setwd("~/Dev/STARNET-site")

ct_project_dir = "~/GoogleDrive/projects/STARNET/cross-tissue"

# Load inferred Bayesian  network
# Bayesian networks
# netw = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/all.tsv"))
# nodes = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/nodes.tsv"))
# kda = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/kda/modules.results.txt"))

# Regulatory gene networks inferred with GENIE3
netw = fread(file.path(ct_project_dir, "co-expression/annotate/grn/all.tsv"))
nodes = fread(file.path(ct_project_dir, "co-expression/annotate/grn/nodes.tsv"))
kda = fread(file.path(ct_project_dir, "co-expression/annotate/grn/kda/modules.results.txt"))



# add source node cluster
netw$module = nodes$MODULE[match(netw$TAIL, nodes$NODE)]

# Add source key driver statistics (for filtering purposes)
netw$kda_FDR = kda$FDR[match(netw$TAIL, kda$NODE)]

# Format edge list
netw = rename(netw,
	replace=c(
		"TAIL"="source",
		"HEAD"="target"
	)
)

# Remove ensembl version from ndoe ids
# WARNING: does not work with gene names containing '.'
# netw$from = sapply(strsplit(netw$from, "[.]"), function(x) x[1])
# netw$to = sapply(strsplit(netw$to, "[.]"), function(x) x[1])

netw = data.frame(netw)

# Drop columns
netw = netw[, !(colnames(netw) %in% c("WEIGHT"))]

netw = netw[which(netw$kda_FDR < 0.05), ]

# Sort by FDR
netw = netw[order(netw$kda_FDR), ]

# netw[netw$module == 98, ]

# Load gene annotation
annot = fread("data/geneAnnot/annot.csv")

# Print data per co-expression modules as .csv files
for (k in unique(netw$module)) {
	# Edges	
	write.csv(
		netw[netw$module == k, ],
		file=paste0("app/static/data/rgn/edges/", k, ".csv"),
		row.names=FALSE,
		quote=FALSE)

	# Nodes
	idx = netw$module == k
	nodes = unique(c(netw$source[idx], netw$target[idx]))

	# Convert node ids to match annotation format
	nodes_short = sapply(nodes, function(id) {
		tissue = strsplit(id, "_")[[1]][1]
		ensembl = strsplit(id, "_")[[1]][3]
		ensembl_base = strsplit(ensembl, "[.]")[[1]][1]

		return(paste(tissue, ensembl_base, sep="_"))
	})

	# Annotations for node in network
	annot_sub = annot[match(nodes_short, annot$V1), ]
	# Rename nodes 
	annot_sub$V1 = nodes
	colnames(annot_sub)[1] = "id"

	write.csv(annot_sub,
		file=paste0("app/static/data/rgn/nodes/", k, ".csv"),
		row.names=FALSE,
		quote=FALSE
	)
}
