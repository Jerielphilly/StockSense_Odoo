from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g., 'Main Warehouse', 'Rack A'
    type = Column(String(50), default="internal") # internal, vendor, customer

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(100))
    uom = Column(String(20), default="Units") # Unit of Measure (kg, pcs)

class StockLevel(Base):
    __tablename__ = "stock_levels"
    # This tracks exactly how much of a product is in a specific location
    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    location_id = Column(Integer, ForeignKey("locations.id"), primary_key=True)
    quantity = Column(Integer, default=0, nullable=False)

class StockMove(Base):
    __tablename__ = "stock_moves"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Nullable because a Vendor Receipt has no "internal" source, and a Delivery has no "internal" destination
    source_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    dest_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    
    quantity = Column(Integer, nullable=False)
    
    # e.g., 'receipt', 'delivery', 'internal', 'adjustment'
    type = Column(String(50), nullable=False)
    
    # e.g., 'draft', 'waiting', 'ready', 'done', 'canceled'
    status = Column(String(50), default='draft', nullable=False)

    # Added to perfectly match PDF requirement: "Add supplier & products" or "Sales order"
    reference = Column(String(255), nullable=True)