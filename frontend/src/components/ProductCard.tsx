import { useNavigate } from "react-router-dom";
import type { Product } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/" } } });
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // handled globally
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div style={styles.imageWrapper}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x300?text=No+Image";
          }}
        />
        {product.stockQuantity <= 3 && product.stockQuantity > 0 && (
          <span style={styles.lowStock}>
            <AlertCircle size={11} />
            Only {product.stockQuantity} left
          </span>
        )}
      </div>

      <div style={styles.body}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>

        <div style={styles.footer}>
          <span style={styles.price}>{formatPrice(product.price)}</span>
          <button
            style={{
              ...styles.addBtn,
              ...(added ? styles.addBtnAdded : {}),
              ...(adding ? styles.addBtnLoading : {}),
            }}
            onClick={handleAddToCart}
            disabled={adding || product.stockQuantity === 0}
          >
            {adding ? (
              "Adding..."
            ) : added ? (
              <span style={styles.btnInner}>
                <Check size={13} />
                Added
              </span>
            ) : (
              <span style={styles.btnInner}>
                <ShoppingCart size={13} />
                Add
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  imageWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s",
  },
  lowStock: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e94560",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flex: 1,
  },
  name: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#f0f0f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  description: {
    margin: 0,
    fontSize: 13,
    color: "#888",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flex: 1,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e94560",
  },
  addBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background-color 0.2s",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  addBtnAdded: {
    backgroundColor: "#27ae60",
  },
  addBtnLoading: {
    backgroundColor: "#888",
    cursor: "not-allowed",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
};
