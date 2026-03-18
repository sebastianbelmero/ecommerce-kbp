# KBP Store — eCommerce Full-Stack

Aplikasi eCommerce sederhana dengan arsitektur decoupled client-server. Guest user bisa browse produk, untuk membeli harus register dan login.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript + Bun |
| Backend | ASP.NET Core 8 Web API + EF Core |
| Database | MariaDB |
| Auth | JWT (BCrypt hashing, HttpOnly Cookie) |
| Icons | lucide-react |

## Quick Start (Development)

### Prerequisites

- [.NET SDK 8.0+](https://dotnet.microsoft.com)
- [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- MariaDB / MySQL running locally

### 1. Setup Database

```bash
sudo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS db_kdb;"
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DB_CONNECTION=server=localhost;user=root;password=root;database=db_kdb
JWT_SECRET=super-secret-jwt-key-for-ecommerce-app-2024-kbp
JWT_ISSUER=ecommerce-api
JWT_AUDIENCE=ecommerce-frontend
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=/api
```

### 3. Run Backend (Terminal 1)

```bash
cd backend
dotnet run
```

Backend akan auto-migrate database dan seed akun default pada startup pertama.

### 4. Run Frontend (Terminal 2)

```bash
cd frontend
bun install
bun run dev
```

Buka `http://localhost:5173`. Vite Proxy mem-forward `/api/*` ke backend.

### Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@kbp.com | admin123 |
| User | user@kbp.com | password123 |

## Production Deployment

Build dan deploy dalam satu proses:

```bash
chmod +x deploy.sh
./deploy.sh
```

Script ini akan:
1. Build frontend (`bun run build`)
2. Publish backend (`dotnet publish -c Release`)
3. Copy `frontend/dist/` ke `publish/wwwroot/`
4. Apply database migrations

Jalankan hasil build:

```bash
cd publish && dotnet backend.dll
```

Backend serve API + frontend static files dari `wwwroot/`. Akses di `http://localhost:5000`.

## Project Structure

```
kbp/
├── deploy.sh                   # Deployment script
├── backend/                    # ASP.NET Core Web API
│   ├── Program.cs              # Entry point + config + seed + static files
│   ├── Controllers/            # API endpoints
│   │   ├── AuthController      # Register, Login, Logout, Me
│   │   ├── ProductsController  # Public product listing
│   │   ├── CartController      # Cart CRUD (authenticated)
│   │   ├── OrdersController    # Checkout + order history
│   │   └── AdminController     # Dashboard, CRUD products/orders/users
│   ├── Models/                 # EF Core entities (User, Product, Cart, Order, etc.)
│   ├── DTOs/                   # Request/Response records
│   ├── Services/JwtService.cs  # JWT token generation
│   └── Data/AppDbContext.cs    # DbContext + product seed data
└── frontend/                   # React + Vite + TypeScript
    └── src/
        ├── api/                # Axios API modules (auth, products, cart, orders, admin)
        ├── contexts/           # AuthContext + CartContext
        ├── components/         # Navbar, ProductCard, ProtectedRoute, AdminRoute
        └── pages/              # HomePage, Login, Register, Cart, Checkout, OrderHistory
            └── admin/          # Dashboard, ProductsAdmin, OrdersAdmin, UsersAdmin
```

## API Endpoints

| Group | Method | Path | Auth |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Public |
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/logout` | Public |
| Auth | GET | `/api/auth/me` | Required |
| Products | GET | `/api/products` | Public |
| Products | GET | `/api/products/{id}` | Public |
| Cart | GET | `/api/cart` | Required |
| Cart | POST | `/api/cart/items` | Required |
| Cart | PUT | `/api/cart/items/{productId}` | Required |
| Cart | DELETE | `/api/cart/items/{productId}` | Required |
| Cart | DELETE | `/api/cart` | Required |
| Orders | POST | `/api/orders/checkout` | Required |
| Orders | GET | `/api/orders` | Required |
| Orders | GET | `/api/orders/{id}` | Required |
| Admin | GET | `/api/admin/dashboard` | Admin |
| Admin | CRUD | `/api/admin/products` | Admin |
| Admin | GET | `/api/admin/orders` | Admin |
| Admin | PUT | `/api/admin/orders/{id}/status` | Admin |
| Admin | GET | `/api/admin/users` | Admin |
| Admin | PUT | `/api/admin/users/{id}/role` | Admin |

## Database Migrations

Migrasi berjalan otomatis saat backend startup (`db.Database.Migrate()`). Untuk mengelola manual:

```bash
cd backend
dotnet ef migrations add NamaMigrasi    # Buat migration baru
dotnet ef database update               # Apply ke database
dotnet ef migrations remove             # Hapus migration terakhir
```
