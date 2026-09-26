from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="StockSense API")

@app.post("/locations")
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_loc = models.Location(name=location.name, type=location.type)
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@app.post("/products")
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_prod = models.Product(name=product.name, sku=product.sku, category=product.category, uom=product.uom)
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    
    # Handle the "Initial Stock (optional)" requirement from the PDF
    if product.initial_stock > 0 and product.location_id:
        # 1. Log the adjustment in the ledger
        adj_move = models.StockMove(
            product_id=db_prod.id,
            dest_location_id=product.location_id,
            quantity=product.initial_stock,
            type='adjustment',
            status='done',
            reference='Initial Stock Setup'
        )
        db.add(adj_move)
        
        # 2. Add the actual stock
        stock = models.StockLevel(product_id=db_prod.id, location_id=product.location_id, quantity=product.initial_stock)
        db.add(stock)
        db.commit()
        
    return db_prod

@app.post("/moves")
def create_move(move: schemas.MoveCreate, db: Session = Depends(get_db)):
    # Creates a move in "draft" status (e.g. Pending Receipt or Pending Delivery)
    db_move = models.StockMove(**move.model_dump())
    db.add(db_move)
    db.commit()
    db.refresh(db_move)
    return db_move

@app.post("/moves/{move_id}/validate")
def validate_move(move_id: int, db: Session = Depends(get_db)):
    # The absolute heart of the PDF requirements: "Validate -> stock increases/decreases automatically"
    move = db.query(models.StockMove).filter(models.StockMove.id == move_id).first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")
    if move.status == 'done':
        raise HTTPException(status_code=400, detail="Move already validated")
        
    # If leaving a location (Delivery or Transfer), deduct stock
    if move.source_location_id:
        src_stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.source_location_id).first()
        if not src_stock or src_stock.quantity < move.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock in source location!")
        src_stock.quantity -= move.quantity
        
    # If entering a location (Receipt or Transfer), add stock
    if move.dest_location_id:
        dest_stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.dest_location_id).first()
        if not dest_stock:
            # Create the record if it doesn't exist yet
            dest_stock = models.StockLevel(product_id=move.product_id, location_id=move.dest_location_id, quantity=0)
            db.add(dest_stock)
        dest_stock.quantity += move.quantity

    # Mark the ledger entry as complete
    move.status = 'done'
    db.commit()
    return {"message": "Success! Stock updated automatically."}

@app.get("/stock")
def get_stock(db: Session = Depends(get_db)):
    return db.query(models.StockLevel).all()

from sqlalchemy import func

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    # 1. Total Products
    total_skus = db.query(models.Product).count()
    
    # 2. Total items physically in stock across all locations
    total_items = db.query(func.sum(models.StockLevel.quantity)).scalar() or 0
    
    # 3. Pending Operations
    pending_receipts = db.query(models.StockMove).filter(models.StockMove.type == 'receipt', models.StockMove.status != 'done').count()
    pending_deliveries = db.query(models.StockMove).filter(models.StockMove.type == 'delivery', models.StockMove.status != 'done').count()
    pending_transfers = db.query(models.StockMove).filter(models.StockMove.type == 'internal', models.StockMove.status != 'done').count()
    
    # 4. Low Stock / Out of Stock (Calculate total stock per product)
    stock_by_product = db.query(
        models.StockLevel.product_id, 
        func.sum(models.StockLevel.quantity).label('total_qty')
    ).group_by(models.StockLevel.product_id).all()
    
    # Count products with <= 10 stock
    low_stock_count = sum(1 for item in stock_by_product if item.total_qty <= 10)
    
    # Count products that have absolutely 0 stock (no ledger entries yet)
    products_with_stock = [item.product_id for item in stock_by_product]
    if products_with_stock:
        out_of_stock = db.query(models.Product).filter(~models.Product.id.in_(products_with_stock)).count()
    else:
        out_of_stock = total_skus
        
    return {
        "kpis": {
            "total_products": total_skus,
            "total_items_in_stock": int(total_items),
            "low_or_out_of_stock": low_stock_count + out_of_stock,
            "pending_receipts": pending_receipts,
            "pending_deliveries": pending_deliveries,
            "pending_transfers": pending_transfers
        }
    }
