from database import engine
from sqlalchemy import text

with engine.begin() as c:
    c.execute(text("UPDATE users SET role='manager'"))
print("Done")
