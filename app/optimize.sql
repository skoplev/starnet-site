-- index eQTL table for faster gene queries.
-- uses B-trees
DROP INDEX IF EXISTS gene_index;
CREATE INDEX gene_index ON eqtl (gene);

DROP INDEX IF EXISTS snp_index;
CREATE INDEX snp_index ON eqtl (SNP);

DROP INDEX IF EXISTS eqtl_module_index;
CREATE INDEX eqtl_module_index ON eqtl (clust);

DROP INDEX IF EXISTS eqtl_module_p_index;
CREATE INDEX eqtl_module_p_index ON eqtl (clust, `adj.p-value`);


-- CPM data indexing
DROP INDEX IF EXISTS aor_cpm_index;
CREATE INDEX aor_cpm_index ON cpm_AOR (ensembl_base);

DROP INDEX IF EXISTS blood_cpm_index;
CREATE INDEX blood_cpm_index ON cpm_Blood (ensembl_base);

DROP INDEX IF EXISTS fc_cpm_index;
CREATE INDEX fc_cpm_index ON cpm_FC (ensembl_base);

DROP INDEX IF EXISTS liv_cpm_index;
CREATE INDEX liv_cpm_index ON cpm_LIV (ensembl_base);

DROP INDEX IF EXISTS mam_cpm_index;
CREATE INDEX mam_cpm_index ON cpm_MAM (ensembl_base);

DROP INDEX IF EXISTS mp_cpm_index;
CREATE INDEX mp_cpm_index ON cpm_MP (ensembl_base);

DROP INDEX IF EXISTS sf_cpm_index;
CREATE INDEX sf_cpm_index ON cpm_SF (ensembl_base);

DROP INDEX IF EXISTS SKLM_cpm_index;
CREATE INDEX SKLM_cpm_index ON cpm_SKLM (ensembl_base);

DROP INDEX IF EXISTS vaf_cpm_index;
CREATE INDEX vaf_cpm_index ON cpm_VAF (ensembl_base);

-- Modules table
DROP INDEX IF EXISTS modules_ensembl_index;
CREATE INDEX modules_ensembl_index ON modules (ensembl);

DROP INDEX IF EXISTS modules_clust_index;
CREATE INDEX modules_clust_index ON modules (clust);

-- Endocrines table
DROP INDEX IF EXISTS endocrines_from_module_index;
CREATE INDEX endocrines_from_module_index ON endocrines (from_module);
