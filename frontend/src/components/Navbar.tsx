import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  ShoppingBag,
  Shield,
  LogOut,
  Store,
  Package,
  ArrowLeft,
  User,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "Admin";
  const isAdminPage = location.pathname.startsWith("/admin");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brand}>
          <Store size={20} />
          KBP Store
        </Link>

        <div style={styles.right}>
          {!isAdminPage && (
            <Link to="/" style={styles.link}>
              Products
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {isAdmin &&
                (isAdminPage ? (
                  <Link to="/" style={styles.adminActiveBtn}>
                    <ArrowLeft size={14} />
                    Back to Store
                  </Link>
                ) : (
                  <Link to="/admin" style={styles.adminBtn}>
                    <Shield size={14} />
                    Admin Panel
                  </Link>
                ))}

              {!isAdminPage && (
                <>
                  <Link to="/orders" style={styles.link}>
                    <Package size={15} />
                    My Orders
                  </Link>

                  <Link to="/cart" style={styles.cartBtn}>
                    <ShoppingBag size={15} />
                    Cart
                    {cartCount > 0 && (
                      <span style={styles.badge}>{cartCount}</span>
                    )}
                  </Link>
                </>
              )}

              <span style={styles.username}>
                <User size={13} />
                {user?.username}
              </span>

              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={13} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" style={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: "#1a1a2e",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  },
  brand: {
    color: "#e94560",
    fontSize: 20,
    fontWeight: 700,
    textDecoration: "none",
    letterSpacing: 0.5,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  link: {
    color: "#ccc",
    textDecoration: "none",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 5,
    transition: "color 0.2s",
  },
  cartBtn: {
    color: "#fff",
    textDecoration: "none",
    fontSize: 14,
    backgroundColor: "#e94560",
    padding: "6px 14px",
    borderRadius: 20,
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    backgroundColor: "#fff",
    color: "#e94560",
    borderRadius: "50%",
    width: 20,
    height: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  username: {
    color: "#aaa",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "1px solid #e94560",
    color: "#e94560",
    padding: "5px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "inherit",
  },
  registerBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
  adminBtn: {
    backgroundColor: "rgba(155,89,182,0.2)",
    border: "1.5px solid #9b59b6",
    color: "#9b59b6",
    padding: "5px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
  },
  adminActiveBtn: {
    backgroundColor: "rgba(52,152,219,0.15)",
    border: "1.5px solid #3498db",
    color: "#3498db",
    padding: "5px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
  },
};
