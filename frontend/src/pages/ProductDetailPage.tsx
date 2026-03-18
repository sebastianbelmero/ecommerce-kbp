import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productsApi, type Product } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  ShoppingCart,
  Check,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    productsApi
      .getById(Number(id))
      .then(setProduct)
      .catch(() => setError("Product not found."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    if (!product) return;

    setAdding(true);
    setAddError(null);
    try {
      await addItem(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add item to cart.";
      setAddError(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    setQuantity((prev) =>
      Math.min(Math.max(1, prev + delta), product.stockQuantity),
    );
  };

  if (isLoading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.fullCenter}>
        <AlertCircle size={48} color="#e94560" />
        <p style={styles.errorText}>{error ?? "Product not found."}</p>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          <ArrowLeft size={15} />
          Back to Products
        </button>
      </div>
    );
  }

  const outOfStock = product.stockQuantity === 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <span style={styles.breadcrumbLink} onClick={() => navigate("/")}>
            Products
          </span>
          <ChevronRight size={14} color="#555" />
          <span style={styles.breadcrumbCurrent}>{product.name}</span>
        </div>

        {/* Main content */}
        <div style={styles.card}>
          {/* Image */}
          <div style={styles.imageWrapper}>
            <img
              src={product.imageUrl}
              alt={product.name}
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/600x400?text=No+Image";
              }}
            />
            {outOfStock && (
              <div style={styles.outOfStockOverlay}>
                <span style={styles.outOfStockText}>Out of Stock</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.info}>
            <h1 style={styles.name}>{product.name}</h1>

            <p style={styles.price}>{formatPrice(product.price)}</p>

            <div style={styles.stockBadge}>
              {outOfStock ? (
                <span style={{ ...styles.stockPill, ...styles.stockOut }}>
                  Out of Stock
                </span>
              ) : product.stockQuantity <= 5 ? (
                <span style={{ ...styles.stockPill, ...styles.stockLow }}>
                  <AlertTriangle size={12} />
                  Only {product.stockQuantity} left
                </span>
              ) : (
                <span style={{ ...styles.stockPill, ...styles.stockOk }}>
                  <Check size={12} />
                  In Stock ({product.stockQuantity} available)
                </span>
              )}
            </div>

            <div style={styles.divider} />

            <p style={styles.descriptionLabel}>Description</p>
            <p style={styles.description}>{product.description}</p>

            <div style={styles.divider} />

            {/* Quantity selector */}
            {!outOfStock && (
              <div style={styles.quantityRow}>
                <span style={styles.qtyLabel}>Quantity</span>
                <div style={styles.qtyControls}>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={styles.qtyValue}>{quantity}</span>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Subtotal */}
            {!outOfStock && (
              <p style={styles.subtotal}>
                Subtotal:{" "}
                <strong style={{ color: "#e94560" }}>
                  {formatPrice(product.price * quantity)}
                </strong>
              </p>
            )}

            {/* Add to cart error */}
            {addError && (
              <div style={styles.addError}>
                <AlertTriangle size={14} />
                {addError}
              </div>
            )}

            {/* Action buttons */}
            <div style={styles.actions}>
              <button
                style={{
                  ...styles.addToCartBtn,
                  ...(outOfStock || adding ? styles.disabledBtn : {}),
                  ...(added ? styles.addedBtn : {}),
                }}
                onClick={handleAddToCart}
                disabled={outOfStock || adding}
              >
                {adding ? (
                  "Adding to Cart..."
                ) : added ? (
                  <>
                    <Check size={16} />
                    Added to Cart
                  </>
                ) : outOfStock ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Add to Cart
                  </>
                )}
              </button>

              {isAuthenticated && !outOfStock && (
                <button
                  style={styles.buyNowBtn}
                  onClick={async () => {
                    await handleAddToCart();
                    navigate("/cart");
                  }}
                  disabled={outOfStock || adding}
                >
                  Buy Now
                </button>
              )}
            </div>

            {!isAuthenticated && (
              <p style={styles.loginHint}>
                <span
                  style={styles.loginHintLink}
                  onClick={() =>
                    navigate("/login", {
                      state: { from: { pathname: `/products/${id}` } },
                    })
                  }
                >
                  Login
                </span>{" "}
                or{" "}
                <span
                  style={styles.loginHintLink}
                  onClick={() => navigate("/register")}
                >
                  Register
                </span>{" "}
                to add items to your cart.
              </p>
            )}
          </div>
        </div>

        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          <ArrowLeft size={15} />
          Back to Products
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f3460",
    color: "#f0f0f0",
    padding: "40px 0 80px",
  },
  container: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  fullCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 16,
    backgroundColor: "#0f3460",
    color: "#f0f0f0",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #2a2a4a",
    borderTop: "4px solid #e94560",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#888", fontSize: 14, margin: 0 },
  errorText: { color: "#e94560", fontSize: 16, margin: 0 },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "#888",
  },
  breadcrumbLink: {
    color: "#e94560",
    cursor: "pointer",
    textDecoration: "underline",
  },
  breadcrumbCurrent: { color: "#ccc" },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  imageWrapper: {
    position: "relative",
    backgroundColor: "#1a1a2e",
  },
  image: {
    width: "100%",
    height: "100%",
    minHeight: 360,
    objectFit: "cover",
    display: "block",
  },
  outOfStockOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    backgroundColor: "#e94560",
    padding: "8px 24px",
    borderRadius: 8,
  },
  info: {
    padding: "36px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  name: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.3,
  },
  price: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#e94560",
  },
  stockBadge: { display: "flex" },
  stockPill: {
    fontSize: 13,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  stockOk: { backgroundColor: "rgba(39,174,96,0.2)", color: "#27ae60" },
  stockLow: { backgroundColor: "rgba(243,156,18,0.2)", color: "#f39c12" },
  stockOut: { backgroundColor: "rgba(233,69,96,0.2)", color: "#e94560" },
  divider: {
    height: 1,
    backgroundColor: "#2a2a4a",
    margin: "4px 0",
  },
  descriptionLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#888",
  },
  description: {
    margin: 0,
    fontSize: 14,
    color: "#ccc",
    lineHeight: 1.7,
  },
  quantityRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  qtyLabel: { fontSize: 14, color: "#aaa", fontWeight: 600 },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: "4px 8px",
    border: "1px solid #2a2a4a",
  },
  qtyBtn: {
    width: 30,
    height: 30,
    border: "none",
    backgroundColor: "transparent",
    color: "#e94560",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    transition: "background-color 0.2s",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  qtyValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },
  subtotal: {
    margin: 0,
    fontSize: 14,
    color: "#aaa",
  },
  addError: {
    backgroundColor: "rgba(233,69,96,0.15)",
    border: "1px solid #e94560",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#e94560",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "13px 20px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.2s",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addedBtn: { backgroundColor: "#27ae60" },
  disabledBtn: { backgroundColor: "#555", cursor: "not-allowed" },
  buyNowBtn: {
    flex: 1,
    backgroundColor: "transparent",
    color: "#e94560",
    border: "2px solid #e94560",
    padding: "13px 20px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  loginHint: {
    margin: 0,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  loginHintLink: {
    color: "#e94560",
    cursor: "pointer",
    fontWeight: 600,
    textDecoration: "underline",
  },
  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    border: "1px solid #2a2a4a",
    color: "#aaa",
    padding: "8px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
  },
};
