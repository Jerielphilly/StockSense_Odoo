import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Config
SECRET_KEY = "super_secret_hackathon_key_replace_me_later" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login_id: str = payload.get("sub")
        if login_id is None:
            raise credentials_exception
        return login_id
    except jwt.PyJWTError:
        raise credentials_exception

def send_otp_email_background(email: str, otp: str):
    """
    Sends an email using Python's native smtplib.
    If no Gmail credentials are provided in .env, it defaults to printing the OTP in the terminal!
    """
    gmail_user = os.getenv("GMAIL_USER")
    gmail_app_password = os.getenv("GMAIL_PASSWORD")
    
    if not gmail_user or not gmail_app_password:
        print("\n" + "="*40)
        print("🚨 SIMULATED EMAIL (No Gmail credentials found in .env)")
        print(f"To: {email}")
        print(f"Your Password Reset OTP is: {otp}")
        print("="*40 + "\n")
        return

    msg = EmailMessage()
    msg.set_content(f"Hello!\n\nYour StockSense password reset OTP is: {otp}\n\nIt expires in 10 minutes.")
    msg['Subject'] = 'StockSense - Password Reset OTP'
    msg['From'] = gmail_user
    msg['To'] = email

    try:
        # Connect securely to Gmail's SMTP server
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(gmail_user, gmail_app_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ OTP email successfully sent to {email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
