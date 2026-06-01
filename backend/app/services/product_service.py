from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

def get_all_products(db: Session, search: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Product]:
    query = db.query(Product)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def get_product_by_id(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

def create_product(db: Session, product_data: ProductCreate) -> Product:
    # Check SKU uniqueness
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    product = Product(**product_data.dict())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
    return product

def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Product:
    product = get_product_by_id(db, product_id)

    # Check SKU uniqueness if updating SKU
    if product_data.sku and product_data.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_data.sku).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    update_data = product_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product

def delete_product(db: Session, product_id: int) -> dict:
    product = get_product_by_id(db, product_id)
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

def get_low_stock_products(db: Session, threshold: int = 10) -> List[Product]:
    return db.query(Product).filter(Product.stock_quantity <= threshold).all()
