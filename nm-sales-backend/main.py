from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date, time
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        "SELECT id, title, address, city, zip, date, start_time, end_time, description, categories FROM sales"
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "address": r[2],
            "city": r[3],
            "zip": r[4],
            "date": str(r[5]),
            "start_time": str(r[6]),
            "end_time": str(r[7]),
            "description": r[8],
            "categories": r[9],
        }
        for r in rows
    ]


@app.get("/sales/{sale_id}")
def get_sale(sale_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, address, city, zip, date, start_time, end_time, description, categories FROM sales WHERE id = %s",
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
        "zip": row[4],
        "date": str(row[5]),
        "start_time": str(row[6]),
        "end_time": str(row[7]),
        "description": row[8],
        "categories": row[9],
    }


@app.post("/sales")
def create_sale(sale: Sale):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO sales (title, address, city, zip, date, start_time, end_time, description, categories)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (sale.title, sale.address, sale.city, sale.zip, sale.date,
         sale.start_time, sale.end_time, sale.description, sale.categories),
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
