# InventoryOS — Inventory & Order Management System

A production-ready full-stack inventory management system with JWT authentication, real-time analytics charts, and a dark futuristic UI.

## Features

- **JWT Authentication** — Signup, Login, Logout with protected routes
- **Dashboard** — Stats cards, Revenue Contribution donut chart, Stock Status bar chart, Low Stock table, Recent Orders table
- **Products** — CRUD with category, SKU, price, stock
- **Customers** — CRUD with email validation
- **Orders** — Create orders with automatic stock deduction
- **Dark UI** — Glassmorphism, purple-blue gradient theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, Tailwind CSS, Recharts, React Router |
| Backend | FastAPI, SQLAlchemy, Pydantic, JWT |
| Database | PostgreSQL |
| DevOps | Docker, Docker Compose |

## Quick Start (Docker)

```bash
git clone <repo>
cd inventory-system
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Edit DATABASE_URL to local postgres
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://postgres:password@db:5432/inventory_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PORT=8000
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Get current user |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Summary stats |
| GET | /api/dashboard/revenue-by-category | Pie chart data |
| GET | /api/dashboard/stock-status | Bar chart data |
| GET | /api/dashboard/low-stock-table | Low stock table |
| GET | /api/dashboard/recent-orders | Recent orders |

### Products
| Method | Endpoint |
|--------|----------|
| GET | /api/products/ |
| POST | /api/products/ |
| PUT | /api/products/{id} |
| DELETE | /api/products/{id} |
| GET | /api/products/low-stock |

### Customers / Orders — similar CRUD at `/api/customers/` and `/api/orders/`

## Deployment

**Backend** → Render.com (set env vars in dashboard)  
**Frontend** → Vercel (set `VITE_API_URL` to backend URL)  
**Database** → Neon PostgreSQL or Supabase (free tier)
