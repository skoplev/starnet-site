from app import db

# Gene exression data model
class ExpressionCPM(db.Model):
    ensembl_id = db.Column(db.String(64), primary_key=True)
    tissue = db.Column(db.String(64), index=True)
    symbol = db.Column(db.String(64), index=True)
    # email = db.Column(db.String(120), index=True, unique=True)
    # password_hash = db.Column(db.String(128))

    # Expression data in an array of Float
    data = db.Column(db.Float())


    def __repr__(self):
        return '<Ensembl {}, Gene {}, expression {}>'.format(self.ensembl_id, self.symbol, self.data)    
