from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import models, schemas
from database import engine, get_db
from sqlalchemy import func

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── LOCATIONS ────────────────────────────────────────────
@app.get("/locations")
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()

@app.post("/locations")
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_loc = models.Location(name=location.name, type=location.type)
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@app.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return {"message": "Deleted"}

# ─── PRODUCTS ─────────────────────────────────────────────
@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    result = []
    for p in products:
        total_qty = db.query(func.sum(models.StockLevel.quantity)).filter(
            models.StockLevel.product_id == p.id
        ).scalar() or 0
        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category,
            "uom": p.uom,
            "qty_available": int(total_qty)
        })
    return result

@app.post("/products")
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_prod = models.Product(name=product.name, sku=product.sku, category=product.category, uom=product.uom)
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    if product.initial_stock > 0 and product.location_id:
        adj_move = models.StockMove(
            product_id=db_prod.id,
            dest_location_id=product.location_id,
            quantity=product.initial_stock,
            type='adjustment',
            status='done',
            reference='Initial Stock Setup'
        )
        db.add(adj_move)
        stock = models.StockLevel(product_id=db_prod.id, location_id=product.location_id, quantity=product.initial_stock)
        db.add(stock)
        db.commit()
    return db_prod

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.query(models.StockLevel).filter(models.StockLevel.product_id == product_id).delete()
    db.delete(prod)
    db.commit()
    return {"message": "Deleted"}

# ─── MOVES ────────────────────────────────────────────────
@app.get("/moves")
def get_moves(db: Session = Depends(get_db)):
    moves = db.query(models.StockMove).order_by(models.StockMove.id.desc()).all()
    result = []
    for m in moves:
        product = db.query(models.Product).filter(models.Product.id == m.product_id).first()
        src = db.query(models.Location).filter(models.Location.id == m.source_location_id).first() if m.source_location_id else None
        dst = db.query(models.Location).filter(models.Location.id == m.dest_location_id).first() if m.dest_location_id else None
        result.append({
            "id": m.id,
            "reference": m.reference or f"WH/{m.type.upper()[:3]}/{str(m.id).zfill(5)}",
            "product_id": m.product_id,
            "product_name": product.name if product else "Unknown",
            "product_sku": product.sku if product else "",
            "source_location_id": m.source_location_id,
            "source_location": src.name if src else "Vendor / External",
            "dest_location_id": m.dest_location_id,
            "dest_location": dst.name if dst else "Customer / External",
            "quantity": m.quantity,
            "type": m.type,
            "status": m.status,
        })
    return result

@app.post("/moves")
def create_move(move: schemas.MoveCreate, db: Session = Depends(get_db)):
    db_move = models.StockMove(**move.model_dump())
    db.add(db_move)
    db.commit()
    db.refresh(db_move)
    return db_move

@app.post("/moves/{move_id}/validate")
def validate_move(move_id: int, db: Session = Depends(get_db)):
    move = db.query(models.StockMove).filter(models.StockMove.id == move_id).first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")
    if move.status == 'done':
        raise HTTPException(status_code=400, detail="Move already validated")
    if move.source_location_id:
        src_stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.source_location_id).first()
        if not src_stock or src_stock.quantity < move.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock in source location!")
        src_stock.quantity -= move.quantity
    if move.dest_location_id:
        dest_stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.dest_location_id).first()
        if not dest_stock:
            dest_stock = models.StockLevel(product_id=move.product_id, location_id=move.dest_location_id, quantity=0)
            db.add(dest_stock)
        dest_stock.quantity += move.quantity
    move.status = 'done'
    db.commit()
    return {"message": "Stock updated successfully."}

@app.delete("/moves/{move_id}")
def delete_move(move_id: int, db: Session = Depends(get_db)):
    move = db.query(models.StockMove).filter(models.StockMove.id == move_id).first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")
    db.delete(move)
    db.commit()
    return {"message": "Deleted"}

# ─── STOCK LEVELS ─────────────────────────────────────────
@app.get("/stock")
def get_stock(db: Session = Depends(get_db)):
    levels = db.query(models.StockLevel).all()
    result = []
    for s in levels:
        product = db.query(models.Product).filter(models.Product.id == s.product_id).first()
        location = db.query(models.Location).filter(models.Location.id == s.location_id).first()
        result.append({
            "product_id": s.product_id,
            "product_name": product.name if product else "Unknown",
            "product_sku": product.sku if product else "",
            "product_category": product.category if product else "",
            "product_uom": product.uom if product else "Units",
            "location_id": s.location_id,
            "location_name": location.name if location else "Unknown",
            "quantity": s.quantity
        })
    return result

# ─── DASHBOARD ────────────────────────────────────────────
@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_skus = db.query(models.Product).count()
    total_items = db.query(func.sum(models.StockLevel.quantity)).scalar() or 0
    pending_receipts = db.query(models.StockMove).filter(models.StockMove.type == 'receipt', models.StockMove.status != 'done').count()
    pending_deliveries = db.query(models.StockMove).filter(models.StockMove.type == 'delivery', models.StockMove.status != 'done').count()
    pending_transfers = db.query(models.StockMove).filter(models.StockMove.type == 'internal', models.StockMove.status != 'done').count()
    stock_by_product = db.query(
        models.StockLevel.product_id,
        func.sum(models.StockLevel.quantity).label('total_qty')
    ).group_by(models.StockLevel.product_id).all()
    low_stock_count = sum(1 for item in stock_by_product if item.total_qty <= 10)
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
