# eCommerce Project Plan & Architecture

## 1. Project Overview
A simple eCommerce application where guest users can freely browse available products. To make a purchase, users must register and log in. Once authenticated, users can add items to their shopping cart, select a payment method, and submit their order.

## 2. Architecture
The system follows a decoupled Client-Server architecture:

- **Frontend:** React application (Vite + Bun + TypeScript) responsible for the UI/UX. It communicates with the backend via RESTful APIs and handles state management and routing.
- **Backend:** ASP.NET Core Web API. This layer handles all business logic, authentication, and data access. It uses Entity Framework Core (with LINQ) to interact with the database.
- **Database:** MariaDB, storing relational data such as users, products, carts, and orders.
- **Authentication (Best Practice):** JSON Web Tokens (JWT) stored in **HttpOnly Cookies**. Instead of storing the token in `localStorage` (which is vulnerable to XSS attacks), the backend sets an `HttpOnly`, `Secure`, and `SameSite` cookie containing the JWT. The browser automatically includes this cookie in subsequent requests to the backend.

## 3. Environment Configurations (.env)
To manage different environments (development, production), both frontend and backend will utilize environment variables.

### Backend (`backend/.env` or `appsettings.json`)
```env
DB_CONNECTION="server=localhost;user=root;password=root;database=db_kdb"
JWT_SECRET="your-super-secret-key-that-is-very-long"
JWT_ISSUER="ecommerce-api"
JWT_AUDIENCE="ecommerce-frontend"
CORS_ORIGIN="http://localhost:5173" # Frontend URL
```

### Frontend (`frontend/.env`)
```env
# Since we use Vite Proxy, we might not need the full URL for API calls in dev,
# but it's good practice for production configuration.
VITE_API_BASE_URL="/api" 
```

## 4. Vite Proxy Configuration
To avoid CORS issues during development and to simplify API calls, we will configure Vite to proxy requests starting with `/api` to the ASP.NET Core backend.

**`frontend/vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ASP.NET Core Backend URL
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```
With this setup, the frontend simply calls `/api/products` and Vite handles forwarding it to the backend.

## 5. User Flows

### Guest Flow
1. User visits the web application.
2. User views the homepage with a list of products.
3. User clicks on a product to view details.
4. If the user attempts to add an item to the cart or checkout, they are redirected to the Login/Register page.

### Authenticated User Flow
1. User registers for a new account or logs in with existing credentials.
2. Upon successful login, the backend responds with a `Set-Cookie` header containing the JWT as an `HttpOnly` cookie.
3. User browses products and adds desired items to their shopping cart. All subsequent requests to protected API endpoints will automatically include the cookie.
4. User navigates to the Cart page to review selected items.
5. User proceeds to Checkout, selects a payment method.
6. User submits the order. The cart is cleared, and an order record is created.
7. User clicks Logout, which calls an endpoint to clear the HttpOnly cookie.

## 6. Database Schema (MariaDB)
**Connection String:** `server=localhost;user=root;password=root;database=db_kdb`

We will use EF Core Code-First approach to generate the following schema:

- **Users**
  - `Id` (GUID/Int, PK)
  - `Username` (String)
  - `Email` (String)
  - `PasswordHash` (String)
  - `CreatedAt` (DateTime)

- **Products**
  - `Id` (Int, PK)
  - `Name` (String)
  - `Description` (String)
  - `Price` (Decimal)
  - `StockQuantity` (Int)
  - `ImageUrl` (String)

- **Carts**
  - `Id` (Int, PK)
  - `UserId` (FK to Users)

- **CartItems**
  - `Id` (Int, PK)
  - `CartId` (FK to Carts)
  - `ProductId` (FK to Products)
  - `Quantity` (Int)

- **Orders**
  - `Id` (Int, PK)
  - `UserId` (FK to Users)
  - `TotalAmount` (Decimal)
  - `PaymentMethod` (String)
  - `Status` (String - e.g., "Pending", "Paid", "Shipped")
  - `CreatedAt` (DateTime)

- **OrderItems**
  - `Id` (Int, PK)
  - `OrderId` (FK to Orders)
  - `ProductId` (FK to Products)
  - `Quantity` (Int)
  - `UnitPrice` (Decimal)

## 7. API Endpoints Design (ASP.NET Core)

### Authentication (`/api/auth`) - *Public*
- `POST /register`: Registers a new user.
- `POST /login`: Authenticates user, generates JWT, and appends it to the response as an `HttpOnly` cookie.
- `POST /logout`: Clears the JWT cookie from the user's browser.
- `GET /me`: Verifies the cookie and returns the logged-in user's basic info.

### Products (`/api/products`) - *Public*
- `GET /`: Retrieves all products (Uses LINQ to query and project data, e.g., `.Select()`, `.Where()`).
- `GET /{id}`: Retrieves details of a specific product.

### Cart (`/api/cart`) - *Protected (Requires Valid Cookie)*
- `GET /`: Retrieves the current user's cart and items.
- `POST /items`: Adds a product to the cart (or updates quantity if it exists).
- `DELETE /items/{productId}`: Removes a product from the cart.

### Orders (`/api/orders`) - *Protected (Requires Valid Cookie)*
- `POST /checkout`: Converts the current user's cart into an order, sets the payment method, and clears the cart. Uses LINQ transactions.
- `GET /`: Retrieves the current user's order history.

## 8. Development Plan

### Phase 1: Backend Setup & Database Configuration
1. Create a new ASP.NET Core Web API project.
2. Install necessary NuGet packages: `Microsoft.EntityFrameworkCore`, `Pomelo.EntityFrameworkCore.MySql`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `DotNetEnv` (for reading .env).
3. Configure `Program.cs` to read `.env` and set up the MariaDB connection.
4. Create EF Core entity models and `AppDbContext`.
5. Run EF Core migrations to create the `db_kdb` database.
6. Seed initial product data using EF Core `HasData`.

### Phase 2: Authentication & Authorization (HttpOnly Cookies)
1. Implement JWT generation service.
2. Build the `AuthController` with `Login`. Ensure the token is appended using `Response.Cookies.Append("jwt", token, new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.Strict, Secure = true })`.
3. Configure the ASP.NET Core JWT Bearer middleware to extract the token from incoming cookies instead of the Authorization header.

### Phase 3: Business Logic & API Endpoints
1. Build `ProductController` using LINQ for data retrieval.
2. Build `CartController` to manage user sessions' carts based on their user ID extracted from the claims in the cookie.
3. Build `OrderController` to handle the checkout process transactionally.

### Phase 4: Frontend Integration
1. Set up Vite with React, Bun, and TypeScript. Add proxy configuration in `vite.config.ts`.
2. Configure `axios` or native `fetch` to always include cookies by setting `{ withCredentials: true }`.
3. Build the UI components: Product List, Product Card, Cart Drawer/Page, Checkout Form, Login/Register Forms.
4. Integrate frontend state (e.g., Context API or Zustand) to manage authentication state globally.

### Phase 5: Testing & Deployment
1. Test end-to-end flows. Ensure HttpOnly cookies are working and no CORS errors occur.
2. Prepare the production build for frontend and backend.
3. Execute deployment script.

---

## 9. Deployment Script (`deploy.sh`)

Create a `deploy.sh` script in the root of your project to automate the build and deployment process.

```bash
#!/bin/bash

# Configuration variables
PROJECT_ROOT="/home/ubuntu/kbp"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
PUBLISH_DIR="$PROJECT_ROOT/publish"

echo "========================================"
echo "Starting eCommerce Deployment Process"
echo "========================================"

# Exit immediately if a command exits with a non-zero status
set -e

# 0. Ensure environment variables exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Warning: Backend .env file not found. Make sure to set your production environment variables."
fi

# 1. Build Frontend (Bun + Vite + React)
echo ">>> [1/4] Building Frontend..."
cd $FRONTEND_DIR
bun install
# Vite will build using variables from .env if present
bun run build
echo "Frontend built successfully. Outputs are in $FRONTEND_DIR/dist"

# 2. Build Backend (ASP.NET Core)
echo ">>> [2/4] Publishing ASP.NET Core Backend..."
cd $BACKEND_DIR
dotnet restore
# Build in Release mode to the publish directory
dotnet publish -c Release -o $PUBLISH_DIR
echo "Backend published successfully to $PUBLISH_DIR"

# 3. Apply Database Migrations
echo ">>> [3/4] Applying Entity Framework Database Migrations..."
cd $BACKEND_DIR
dotnet ef database update
echo "Database migrations applied successfully."

# 4. Restart Services
echo ">>> [4/4] Restarting Services..."
# Assuming backend runs via systemd:
# sudo systemctl restart ecommerce-api.service

# Assuming frontend is served via Nginx:
# sudo cp -r $FRONTEND_DIR/dist/* /var/www/html/
# sudo systemctl reload nginx

echo "========================================"
echo "Deployment Completed Successfully!"
echo "========================================"
```

To run this script:
1. Make it executable: `chmod +x deploy.sh`
2. Run it: `./deploy.sh`
