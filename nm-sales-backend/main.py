from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date, time
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()  # reads DATABASE_URL from .env

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace * with John's exact URL
    allow_methods=["*"],
    allow_headers=["*"],
)


class Sale(BaseModel):
    title: str
    address: str
    city: str
    sale_date: date
    start_time: time
    description: Optional[str] = None


def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn


@app.get("/")
def root():
    return {"message": "NM Sales API is running"}


@app.get("/sales")
def get_sales():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, address, city, sale_date, start_time, description FROM sales"
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "address": r[2],
            "city": r[3],
            "date": str(r[4]),
            "time": str(r[5]),
            "description": r[6],
        }
        for r in rows
    ]


@app.get("/sales/{sale_id}")
def get_sale(sale_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, address, city, sale_date, start_time, description FROM sales WHERE id = %s",
        (sale_id,),
    )
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {
        "id": row[0],
        "title": row[1],
        "address": row[2],
        "city": row[3],
        "date": str(row[4]),
        "time": str(row[5]),
        "description": row[6],
    }


@app.post("/sales")
def create_sale(sale: Sale):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO sales (title, address, city, sale_date, start_time, description)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (sale.title, sale.address, sale.city, sale.sale_date, sale.start_time, sale.description),
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return {"message": "Sale created", "id": new_id}


@app.delete("/sales/{sale_id}")
def delete_sale(sale_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sales WHERE id = %s", (sale_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Sale not found")
    cursor.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
    conn.commit()
    conn.close()
    return {"message": f"Sale {sale_id} deleted"}
