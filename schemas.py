from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    login_id: str
    email: EmailStr
    password: str
    role: str = "staff"

class UserLogin(BaseModel):
    login_id: str
    password: str

class ForgotPassword(BaseModel):
    login_id: str

class VerifyOTP(BaseModel):
    login_id: str
    otp: str

class ResetPassword(BaseModel):
    login_id: str
    otp: str
    new_password: str

class LocationCreate(BaseModel):
    name: str
    type: str = "internal"
    short_code: Optional[str] = None
    warehouse_id: Optional[int] = None

class WarehouseCreate(BaseModel):
    name: str
    short_code: str
    address: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    uom: str = "Units"
    unit_cost: Optional[int] = 0
    initial_stock: Optional[int] = 0
    location_id: Optional[int] = None # Required if initial_stock > 0

class MoveCreate(BaseModel):
    product_id: int
    source_location_id: Optional[int] = None
    dest_location_id: Optional[int] = None
    quantity: int
    type: str # receipt, delivery, internal, adjustment
    reference: Optional[str] = None
    contact: Optional[str] = None
    schedule_date: Optional[datetime] = None

class ReceiptCreate(BaseModel):
    contact: str
    schedule_date: Optional[datetime] = None
    dest_location_id: int
    items: list[dict] # [{"product_id": 1, "quantity": 10}]

class TransferCreate(BaseModel):
    schedule_date: Optional[datetime] = None
    source_location_id: int
    dest_location_id: int
    items: list[dict]
