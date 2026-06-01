from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    low_stock = db.query(Product).filter(Product.stock_quantity <= 10).count()
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_alerts": low_stock
    }

@router.get("/revenue-by-category")
def get_revenue_by_category(db: Session = Depends(get_db)):
    results = (
        db.query(Product.category, func.sum(OrderItem.price * OrderItem.quantity).label("revenue"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.category)
        .all()
    )
    data = [{"category": r.category or "Uncategorized", "revenue": float(r.revenue)} for r in results]
    return data

@router.get("/stock-status")
def get_stock_status(db: Session = Depends(get_db)):
    products = db.query(Product).limit(10).all()
    pending = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("pending"))
        .group_by(OrderItem.product_id)
        .all()
    )
    pending_map = {p.product_id: p.pending for p in pending}
    data = [
        {
            "name": f"{p.name}-{p.sku}",
            "current_stock": p.stock_quantity,
            "pending_orders": pending_map.get(p.id, 0)
        }
        for p in products
    ]
    return data

@router.get("/low-stock-table")
def get_low_stock_table(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.stock_quantity <= 110).all()
    pending = (
        db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("pending"))
        .group_by(OrderItem.product_id)
        .all()
    )
    pending_map = {p.product_id: int(p.pending) for p in pending}
    threshold = 110
    data = []
    for p in products:
        pend = pending_map.get(p.id, 0)
        data.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "current_stock": p.stock_quantity,
            "pending_orders": pend,
            "total_demand": p.stock_quantity + pend,
            "safety_threshold": threshold,
            "alert_status": "Below Threshold"
        })
    return data

@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()
    result = []
    for o in orders:
        for item in o.items:
            result.append({
                "order_id": f"#{str(o.id).zfill(4)}",
                "date": o.created_at.strftime("%m/%d/%Y"),
                "category": item.product.category if item.product else "N/A",
                "product": item.product.name if item.product else "N/A",
                "sku": item.product.sku if item.product else "N/A",
                "total": item.price * item.quantity,
                "quantity": item.quantity
            })
    return result[:10]
