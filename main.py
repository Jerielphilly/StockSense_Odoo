from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="StockSense API")

# Allow React (running on localhost:5173) to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import BackgroundTasks
import auth
import random
from datetime import datetime, timedelta

@app.post("/auth/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter((models.User.email == user.email) | (models.User.login_id == user.login_id)).first():
        raise HTTPException(status_code=400, detail="Email or Login ID already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(login_id=user.login_id, email=user.email, hashed_password=hashed_pwd, role=user.role)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.login_id == user.login_id).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid Login Id or Password")
    
    token = auth.create_access_token(data={"sub": db_user.login_id, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/forgot-password")
def forgot_password(req: schemas.ForgotPassword, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.login_id == req.login_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    db_user.reset_otp = otp
    db_user.otp_expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    db.commit()
    
    background_tasks.add_task(auth.send_otp_email_background, db_user.email, otp)
    return {"message": f"OTP sent to {db_user.email}"}

@app.post("/auth/verify-otp")
def verify_otp(req: schemas.VerifyOTP, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.login_id == req.login_id).first()
    if not db_user or db_user.reset_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if datetime.utcnow() > datetime.fromisoformat(db_user.otp_expiry):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # Clear OTP and log them in
    db_user.reset_otp = None
    db_user.otp_expiry = None
    db.commit()
    
    token = auth.create_access_token(data={"sub": db_user.login_id, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/reset-password")
def reset_password(req: schemas.ResetPassword, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.login_id == req.login_id).first()
    if not db_user or db_user.reset_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if datetime.utcnow() > datetime.fromisoformat(db_user.otp_expiry):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    db_user.hashed_password = auth.get_password_hash(req.new_password)
    db_user.reset_otp = None
    db_user.otp_expiry = None
    db.commit()
    
    token = auth.create_access_token(data={"sub": db_user.login_id, "role": db_user.role})
    return {"message": "Password successfully reset!", "access_token": token, "token_type": "bearer"}

@app.get("/warehouses")
def get_warehouses(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    return db.query(models.Warehouse).all()

@app.post("/warehouses")
def create_warehouse(warehouse: schemas.WarehouseCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    db_warehouse = models.Warehouse(
        name=warehouse.name,
        short_code=warehouse.short_code,
        address=warehouse.address
    )
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

@app.post("/locations")
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    db_loc = models.Location(
        name=location.name, 
        type=location.type,
        short_code=location.short_code,
        warehouse_id=location.warehouse_id
    )
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

@app.post("/products")
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    db_prod = models.Product(name=product.name, sku=product.sku, category=product.category, uom=product.uom, unit_cost=product.unit_cost, created_by=current_user)
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
            reference='Initial Stock Setup',
            created_by=current_user
        )
        db.add(adj_move)
        
        stock = models.StockLevel(product_id=db_prod.id, location_id=product.location_id, quantity=product.initial_stock)
        db.add(stock)
        db.commit()
        
    return db_prod

@app.post("/moves")
def create_move(move: schemas.MoveCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    move_data = move.model_dump()
    move_data["created_by"] = current_user
    db_move = models.StockMove(**move_data)
    db.add(db_move)
    db.commit()
    db.refresh(db_move)
    return db_move

@app.post("/moves/{move_id}/ready")
def mark_move_ready(move_id: int, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    move = db.query(models.StockMove).filter(models.StockMove.id == move_id).first()
    if not move or move.status != 'draft':
        raise HTTPException(status_code=400, detail="Move not found or not in draft status")
    move.status = 'ready'
    db.commit()
    return {"message": "Move marked as ready"}

@app.post("/moves/{move_id}/validate")
def validate_move(move_id: int, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # The absolute heart of the PDF requirements: "Validate -> stock increases/decreases automatically"
    move = db.query(models.StockMove).filter(models.StockMove.id == move_id).first()
    if not move:
        raise HTTPException(status_code=404, detail="Move not found")
    if move.status == 'done':
        raise HTTPException(status_code=400, detail="Move already validated")
    if move.status == 'draft':
        raise HTTPException(status_code=400, detail="Move must be marked as Ready first")
        
    # If leaving a location (Delivery or Transfer), deduct stock
    if move.source_location_id:
        src_stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.source_location_id).first()
        if not src_stock or src_stock.quantity < move.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock in source location!")
        src_stock.quantity -= move.quantity
        
        # --- AUTOMATED REORDERING RULE ---
        # If stock drops below 5, automatically generate a Purchase Order (Draft Receipt)
        if src_stock.quantity < 5:
            # Check if a draft receipt already exists for this product to prevent duplicate orders
            existing_draft = db.query(models.StockMove).filter(
                models.StockMove.product_id == move.product_id,
                models.StockMove.type == 'receipt',
                models.StockMove.status.in_(['draft', 'waiting', 'ready'])
            ).first()
            
            if not existing_draft:
                last_receipt = db.query(models.StockMove).filter(models.StockMove.reference.like('WH/IN/%')).order_by(models.StockMove.id.desc()).first()
                new_ref = f"WH/IN/{int(last_receipt.reference.split('/')[-1]) + 1:04d}" if last_receipt and last_receipt.reference else "WH/IN/0001"
                
                auto_reorder = models.StockMove(
                    product_id=move.product_id,
                    dest_location_id=move.source_location_id,
                    quantity=10, # Automatically order a batch of 10
                    type='receipt',
                    status='draft',
                    reference=new_ref,
                    contact="Auto-Reorder System",
                    created_by=current_user
                )
                db.add(auto_reorder)

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
def get_stock(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Join StockLevel, Product, Location
    results = db.query(models.StockLevel, models.Product, models.Location)\
        .join(models.Product, models.StockLevel.product_id == models.Product.id)\
        .join(models.Location, models.StockLevel.location_id == models.Location.id)\
        .all()
        
    stock_list = []
    for stock, prod, loc in results:
        # Calculate reserved stock (pending deliveries from this location)
        reserved = db.query(func.sum(models.StockMove.quantity)).filter(
            models.StockMove.product_id == prod.id,
            models.StockMove.source_location_id == loc.id,
            models.StockMove.type == 'delivery',
            models.StockMove.status.in_(['draft', 'waiting', 'ready'])
        ).scalar() or 0
        
        stock_list.append({
            "product_id": prod.id,
            "product_name": prod.name,
            "location_id": loc.id,
            "location_name": loc.name,
            "unit_cost": prod.unit_cost,
            "on_hand": stock.quantity,
            "free_to_use": stock.quantity - reserved
        })
    return stock_list

from sqlalchemy import func

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
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

from datetime import datetime, timedelta

@app.get("/analytics/flow")
def get_analytics_flow(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Calculate stock in/out flow for the last 7 days
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)
    
    # We will query all completed moves in the last 7 days
    moves = db.query(models.StockMove).filter(
        models.StockMove.status == 'done'
    ).all()
    
    # Group by date
    daily_data = { (today - timedelta(days=i)).strftime('%m/%d'): {"date": (today - timedelta(days=i)).strftime('%m/%d'), "IN": 0, "OUT": 0} for i in range(7) }
    
    for move in moves:
        # Assuming schedule_date or created_at. We'll use id as a proxy for time or just put them all in today if schedule_date is None
        # Actually, let's use the simplest logic: if no date, skip or put today.
        # But wait, StockMove has schedule_date. If null, we can't chart it. So we assume today.
        move_date = move.schedule_date.date() if move.schedule_date else today
        date_str = move_date.strftime('%m/%d')
        
        if date_str in daily_data:
            if move.type == 'receipt':
                daily_data[date_str]["IN"] += move.quantity
            elif move.type == 'delivery':
                daily_data[date_str]["OUT"] += move.quantity
                
    # Return as an ordered list for Recharts
    return list(reversed(list(daily_data.values())))

@app.get("/products")
def get_products(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    return db.query(models.Product).all()

@app.get("/locations")
def get_locations(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    return db.query(models.Location).all()

@app.post("/receipts")
def create_receipt(receipt: schemas.ReceiptCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Generate WH/IN/000X reference
    last_receipt = db.query(models.StockMove).filter(models.StockMove.reference.like('WH/IN/%')).order_by(models.StockMove.id.desc()).first()
    if last_receipt and last_receipt.reference:
        last_id = int(last_receipt.reference.split('/')[-1])
        new_ref = f"WH/IN/{last_id + 1:04d}"
    else:
        new_ref = "WH/IN/0001"
        
    created_moves = []
    for item in receipt.items:
        move = models.StockMove(
            product_id=item["product_id"],
            dest_location_id=receipt.dest_location_id,
            quantity=item["quantity"],
            type='receipt',
            status='draft',
            reference=new_ref,
            contact=receipt.contact,
            schedule_date=receipt.schedule_date,
            created_by=current_user
        )
        db.add(move)
        created_moves.append(move)
    db.commit()
    return {"reference": new_ref, "message": "Receipt created successfully"}

@app.get("/receipts")
def get_receipts(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Fetch and group in python to avoid MySQL ONLY_FULL_GROUP_BY error
    moves = db.query(models.StockMove, models.Location)\
        .outerjoin(models.Location, models.StockMove.dest_location_id == models.Location.id)\
        .filter(models.StockMove.type == 'receipt').all()
        
    receipts_dict = {}
    for move, loc in moves:
        if move.reference not in receipts_dict:
            receipts_dict[move.reference] = {
                "reference": move.reference,
                "contact": move.contact,
                "schedule_date": move.schedule_date,
                "status": move.status,
                "dest_location_name": loc.name if loc else "Unknown"
            }
    return list(receipts_dict.values())

@app.get("/receipts/{reference:path}")
def get_receipt_details(reference: str, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Get all moves for this receipt
    moves = db.query(models.StockMove, models.Product).join(models.Product, models.StockMove.product_id == models.Product.id).filter(models.StockMove.reference == reference).all()
    if not moves:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    first_move = moves[0][0]
    items = [{"move_id": m[0].id, "product_name": m[1].name, "sku": m[1].sku, "quantity": m[0].quantity, "status": m[0].status} for m in moves]
    
    return {
        "reference": first_move.reference,
        "contact": first_move.contact,
        "schedule_date": first_move.schedule_date,
        "status": first_move.status,
        "created_by": first_move.created_by,
        "items": items
    }

@app.post("/deliveries")
def create_delivery(delivery: schemas.ReceiptCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    # Generate WH/OUT/000X reference (using ReceiptCreate schema since payload structure is identical)
    last_delivery = db.query(models.StockMove).filter(models.StockMove.reference.like('WH/OUT/%')).order_by(models.StockMove.id.desc()).first()
    if last_delivery and last_delivery.reference:
        last_id = int(last_delivery.reference.split('/')[-1])
        new_ref = f"WH/OUT/{last_id + 1:04d}"
    else:
        new_ref = "WH/OUT/0001"
        
    created_moves = []
    for item in delivery.items:
        move = models.StockMove(
            product_id=item["product_id"],
            source_location_id=delivery.dest_location_id, # For delivery, this is the source location (where it ships FROM)
            quantity=item["quantity"],
            type='delivery',
            status='draft',
            reference=new_ref,
            contact=delivery.contact,
            schedule_date=delivery.schedule_date,
            created_by=current_user
        )
        db.add(move)
        created_moves.append(move)
    db.commit()
    return {"reference": new_ref, "message": "Delivery created successfully"}

@app.get("/deliveries")
def get_deliveries(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove, models.Location)\
        .outerjoin(models.Location, models.StockMove.source_location_id == models.Location.id)\
        .filter(models.StockMove.type == 'delivery').all()
        
    deliveries_dict = {}
    for move, loc in moves:
        if move.reference not in deliveries_dict:
            deliveries_dict[move.reference] = {
                "reference": move.reference,
                "contact": move.contact,
                "schedule_date": move.schedule_date,
                "status": move.status,
                "source_location_name": loc.name if loc else "Unknown"
            }
    return list(deliveries_dict.values())

@app.get("/deliveries/{reference:path}")
def get_delivery_details(reference: str, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove, models.Product).join(models.Product, models.StockMove.product_id == models.Product.id).filter(models.StockMove.reference == reference).all()
    if not moves:
        raise HTTPException(status_code=404, detail="Delivery not found")
        
    first_move = moves[0][0]
    items = []
    for m in moves:
        move = m[0]
        prod = m[1]
        # Calculate available stock for this product in the source location
        stock = db.query(models.StockLevel).filter_by(product_id=prod.id, location_id=move.source_location_id).first()
        on_hand = stock.quantity if stock else 0
        items.append({
            "move_id": move.id, 
            "product_name": prod.name, 
            "sku": prod.sku, 
            "quantity": move.quantity, 
            "status": move.status,
            "on_hand": on_hand
        })
    
    return {
        "reference": first_move.reference,
        "contact": first_move.contact,
        "schedule_date": first_move.schedule_date,
        "status": first_move.status,
        "created_by": first_move.created_by,
        "source_location_id": first_move.source_location_id,
        "items": items
    }

@app.post("/deliveries/{reference:path}/check")
def check_delivery_availability(reference: str, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove).filter(models.StockMove.reference == reference).all()
    if not moves:
        raise HTTPException(status_code=404, detail="Delivery not found")
        
    all_available = True
    for move in moves:
        stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.source_location_id).first()
        on_hand = stock.quantity if stock else 0
        if move.quantity > on_hand:
            all_available = False
            break
            
    new_status = 'ready' if all_available else 'waiting'
    for move in moves:
        move.status = new_status
    db.commit()
    
@app.post("/transfers")
def create_transfer(transfer: schemas.TransferCreate, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    last_transfer = db.query(models.StockMove).filter(models.StockMove.reference.like('WH/INT/%')).order_by(models.StockMove.id.desc()).first()
    if last_transfer and last_transfer.reference:
        last_id = int(last_transfer.reference.split('/')[-1])
        new_ref = f"WH/INT/{last_id + 1:04d}"
    else:
        new_ref = "WH/INT/0001"
        
    for item in transfer.items:
        move = models.StockMove(
            product_id=item["product_id"],
            source_location_id=transfer.source_location_id,
            dest_location_id=transfer.dest_location_id,
            quantity=item["quantity"],
            type='internal',
            status='draft',
            reference=new_ref,
            schedule_date=transfer.schedule_date,
            created_by=current_user
        )
        db.add(move)
    db.commit()
    return {"reference": new_ref, "message": "Transfer created successfully"}

@app.get("/transfers")
def get_transfers(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove).filter(models.StockMove.type == 'internal').all()
    transfers_dict = {}
    
    # We need both source and dest location names. Let's map them efficiently.
    locations = {loc.id: loc.name for loc in db.query(models.Location).all()}
    
    for move in moves:
        if move.reference not in transfers_dict:
            transfers_dict[move.reference] = {
                "reference": move.reference,
                "schedule_date": move.schedule_date,
                "status": move.status,
                "source_location_name": locations.get(move.source_location_id, "Unknown"),
                "dest_location_name": locations.get(move.dest_location_id, "Unknown")
            }
    return list(transfers_dict.values())

@app.get("/transfers/{reference:path}")
def get_transfer_details(reference: str, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove, models.Product).join(models.Product, models.StockMove.product_id == models.Product.id).filter(models.StockMove.reference == reference).all()
    if not moves:
        raise HTTPException(status_code=404, detail="Transfer not found")
        
    first_move = moves[0][0]
    items = []
    for m in moves:
        move = m[0]
        prod = m[1]
        stock = db.query(models.StockLevel).filter_by(product_id=prod.id, location_id=move.source_location_id).first()
        items.append({
            "move_id": move.id, 
            "product_name": prod.name, 
            "sku": prod.sku, 
            "quantity": move.quantity, 
            "status": move.status,
            "on_hand": stock.quantity if stock else 0
        })
    
    locations = {loc.id: loc.name for loc in db.query(models.Location).all()}
    
    return {
        "reference": first_move.reference,
        "schedule_date": first_move.schedule_date,
        "status": first_move.status,
        "created_by": first_move.created_by,
        "source_location_name": locations.get(first_move.source_location_id, "Unknown"),
        "dest_location_name": locations.get(first_move.dest_location_id, "Unknown"),
        "items": items
    }

@app.post("/transfers/{reference:path}/check")
def check_transfer_availability(reference: str, db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove).filter(models.StockMove.reference == reference).all()
    if not moves:
        raise HTTPException(status_code=404, detail="Transfer not found")
        
    all_available = True
    for move in moves:
        stock = db.query(models.StockLevel).filter_by(product_id=move.product_id, location_id=move.source_location_id).first()
        if not stock or move.quantity > stock.quantity:
            all_available = False
            break
            
    new_status = 'ready' if all_available else 'waiting'
    for move in moves:
        move.status = new_status
    db.commit()
    return {"message": f"Status updated to {new_status}", "status": new_status}

@app.get("/history")
def get_history(db: Session = Depends(get_db), current_user: str = Depends(auth.get_current_user)):
    moves = db.query(models.StockMove, models.Product).join(models.Product, models.StockMove.product_id == models.Product.id).order_by(models.StockMove.id.desc()).all()
    
    locations = {loc.id: loc.name for loc in db.query(models.Location).all()}
    
    history_list = []
    for move, prod in moves:
        if move.type == 'receipt':
            from_loc = "Vendor"
            to_loc = locations.get(move.dest_location_id, "Unknown")
        elif move.type == 'delivery':
            from_loc = locations.get(move.source_location_id, "Unknown")
            to_loc = "Customer"
        elif move.type == 'internal':
            from_loc = locations.get(move.source_location_id, "Unknown")
            to_loc = locations.get(move.dest_location_id, "Unknown")
        else: # adjustment
            from_loc = locations.get(move.source_location_id, "Inventory Loss") if move.source_location_id else "Inventory Gain"
            to_loc = locations.get(move.dest_location_id, "Inventory Gain") if move.dest_location_id else "Inventory Loss"
            
        history_list.append({
            "id": move.id,
            "reference": move.reference or "Manual Adj",
            "date": move.schedule_date,
            "contact": move.contact or "-",
            "from_loc": from_loc,
            "to_loc": to_loc,
            "product_name": prod.name,
            "sku": prod.sku,
            "quantity": move.quantity,
            "status": move.status,
            "type": move.type
        })
    return history_list
