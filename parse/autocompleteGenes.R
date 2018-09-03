rm(list=ls())

library(data.table)
library(jsonlite)

setwd("~/Dev/STARNET-site")

gene_tab = fread("data/ensembl/genes.csv")

gene_symbols = unique(gene_tab$hgnc_symbol)

write_json(gene_symbols, "app/static/data/gene_symbols.json")

