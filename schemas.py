from pydantic import BaseModel, EmailStr
from typing import Optional

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

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    uom: str = "Units"
    initial_stock: Optional[int] = 0
    location_id: Optional[int] = None # Required if initial_stock > 0

class MoveCreate(BaseModel):
    product_id: int
    source_location_id: Optional[int] = None
    dest_location_id: Optional[int] = None
    quantity: int
    type: str # receipt, delivery, internal, adjustment
    reference: Optional[str] = None
