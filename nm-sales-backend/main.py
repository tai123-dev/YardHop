from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime, timedelta, date as DateType
import psycopg2
import uuid
import os
from dotenv import load_dotenv
import bcrypt
from jose import jwt

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_HOURS = 24

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ── Models ────────────────────────────────────────────────

class Sale(BaseModel):
    title: str
    address: str
    city: str
    zip: Optional[str] = None
    date: date
    start_time: time
    end_time: Optional[time] = None
    description: Optional[str] = None
    categories: Optional[str] = None


class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class SaveSaleRequest(BaseModel):
    sale_id: int


# ── Helpers ───────────────────────────────────────────────

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_HOURS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Root ──────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "NM Sales API is running"}



# ── Sales ─────────────────────────────────────────────────

@app.get("/sales")
def get_sales(city: Optional[str] = None, date: Optional[DateType] = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = (
            "SELECT id, title, address, city, zip, date, start_time, end_time, description, categories "
            "FROM sales WHERE 1=1"
        )
        params = []
        if city:
            query += " AND LOWER(city) = LOWER(%s)"
            params.append(city)
        if date:
            query += " AND date = %s"
            params.append(date)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [
            {
                "id": r[0], "title": r[1], "address": r[2], "city": r[3],
                "zip": r[4], "date": str(r[5]), "start_time": str(r[6]),
                "end_time": str(r[7]), "description": r[8], "categories": r[9],
            }
            for r in rows
        ]
    finally:
        conn.close()


@app.get("/sales/{sale_id}")
def get_sale(sale_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, title, address, city, zip, date, start_time, end_time, description, categories FROM sales WHERE id = %s",
            (sale_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Sale not found")
        return {
            "id": row[0], "title": row[1], "address": row[2], "city": row[3],
            "zip": row[4], "date": str(row[5]), "start_time": str(row[6]),
            "end_time": str(row[7]), "description": row[8], "categories": row[9],
        }
    finally:
        conn.close()


@app.post("/sales")
def create_sale(sale: Sale, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO sales (title, address, city, zip, date, start_time, end_time, description, categories, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (sale.title, sale.address, sale.city, sale.zip or "", sale.date,
             sale.start_time, sale.end_time or sale.start_time, sale.description or "", sale.categories or "", user_id),
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
        return {"message": "Sale created", "id": new_id}
    finally:
        conn.close()


@app.delete("/sales/{sale_id}")
def delete_sale(sale_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM sales WHERE id = %s", (sale_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Sale not found")
        cursor.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
        conn.commit()
        return {"message": f"Sale {sale_id} deleted"}
    finally:
        conn.close()


# ── Auth ──────────────────────────────────────────────────

@app.post("/auth/signup")
def signup(user: UserSignup):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(user.password)
        new_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO users (id, email, full_name, password_hash) VALUES (%s, %s, %s, %s)",
            (new_id, user.email, user.full_name, hashed),
        )
        conn.commit()
        return {"message": "User created", "user_id": str(new_id)}
    finally:
        conn.close()


@app.post("/auth/login")
def login(user: UserLogin):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, password_hash, full_name FROM users WHERE email = %s", (user.email,)
        )
        row = cursor.fetchone()
        if not row or not verify_password(user.password, row[1]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(str(row[0]))
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": str(row[0]), "email": user.email, "full_name": row[2]},
        }
    finally:
        conn.close()


@app.get("/auth/me")
def get_me(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, full_name FROM users WHERE id = %s", (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": str(row[0]), "email": row[1], "full_name": row[2]}
    finally:
        conn.close()


# ── Saved Sales ───────────────────────────────────────────

@app.post("/saved_sales")
def save_sale(req: SaveSaleRequest, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM sales WHERE id = %s", (req.sale_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Sale not found")
        cursor.execute(
            "SELECT id FROM saved_sales WHERE user_id = %s AND sales_id = %s",
            (user_id, req.sale_id),
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already saved")
        cursor.execute(
            "INSERT INTO saved_sales (user_id, sales_id) VALUES (%s, %s)",
            (user_id, req.sale_id),
        )
        conn.commit()
        return {"message": "Sale saved"}
    finally:
        conn.close()


@app.delete("/saved_sales/{sale_id}")
def unsave_sale(sale_id: int, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM saved_sales WHERE user_id = %s AND sales_id = %s",
            (user_id, sale_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Saved sale not found")
        cursor.execute(
            "DELETE FROM saved_sales WHERE user_id = %s AND sales_id = %s",
            (user_id, sale_id),
        )
        conn.commit()
        return {"message": "Sale removed from saved"}
    finally:
        conn.close()


@app.get("/saved_sales")
def get_saved_sales(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT s.id, s.title, s.address, s.city, s.zip,
                   s.date, s.start_time, s.end_time, s.description, s.categories
            FROM saved_sales ss
            JOIN sales s ON ss.sales_id = s.id
            WHERE ss.user_id = %s
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        return [
            {
                "id": r[0], "title": r[1], "address": r[2], "city": r[3],
                "zip": r[4], "date": str(r[5]), "start_time": str(r[6]),
                "end_time": str(r[7]), "description": r[8], "categories": r[9],
            }
            for r in rows
        ]
    finally:
        conn.close()
