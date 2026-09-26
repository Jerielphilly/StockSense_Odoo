from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from database import engine, get_db

# This single line of magic tells SQLAlchemy to create all your MySQL tables if they don't exist yet!
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockSense API")

@app.get("/")
def health_check():
    return {"message": "Welcome to StockSense API. The database is connected and tables are generated!"}

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return products
