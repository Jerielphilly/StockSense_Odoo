import models
from database import engine
from sqlalchemy import text

print("Creating warehouses table...")
models.Base.metadata.create_all(bind=engine)

print("Altering locations table...")
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE locations ADD COLUMN short_code VARCHAR(50);"))
        print("Added short_code column.")
    except Exception as e: print("short_code:", e)
    
    try:
        conn.execute(text("ALTER TABLE locations ADD COLUMN warehouse_id INTEGER;"))
        print("Added warehouse_id column.")
    except Exception as e: print("warehouse_id:", e)
    
    try:
        conn.execute(text("ALTER TABLE locations ADD CONSTRAINT fk_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);"))
        print("Added foreign key constraint.")
    except Exception as e: print("fk_warehouse:", e)

print("Done!")
