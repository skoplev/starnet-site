# Loads and formats Bayesian networks inferred for each co-expression module

rm(list=ls())

library(data.table)
library(plyr)

setwd("~/Dev/STARNET-site")

ct_project_dir = "~/GoogleDrive/projects/STARNET/cross-tissue"

# Load inferred Bayesian  network
netw = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/all.tsv"))
nodes = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/nodes.tsv"))
kda = fread(file.path(ct_project_dir, "co-expression/annotate/bayesNet/kda/modules.results.txt"))


# add source node cluster
netw$module = nodes$MODULE[match(netw$TAIL, nodes$NODE)]

# Add source key driver statistics (for filtering purposes)
netw$kda_FDR = kda$FDR[match(netw$TAIL, kda$NODE)]

# Format edge list
netw = rename(netw,
	replace=c(
		"TAIL"="from",
		"HEAD"="to"
	)
)

# Remove ensembl version from ndoe ids
netw$from = sapply(strsplit(netw$from, "[.]"), function(x) x[1])
netw$to = sapply(strsplit(netw$to, "[.]"), function(x) x[1])

netw = data.frame(netw)

# Drop columns
netw = netw[, !(colnames(netw) %in% c("WEIGHT"))]


# Print data per co-expression modules as .csv files
for (k in unique(netw$module)) {
	write.csv(
		netw[netw$module == k, ],
		file=paste0("app/static/data/rgn/", k, ".csv"),
		row.names=FALSE,
		quote=FALSE)
}
