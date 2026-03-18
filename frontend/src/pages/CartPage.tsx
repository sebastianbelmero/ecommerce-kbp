import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function CartPage() {
  const { cart, isLoading, removeItem, updateItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    try {
      await removeItem(productId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdate = async (productId: number, quantity: number) => {
    setUpdatingId(productId);
    try {
      await updateItem(productId, quantity);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all items from your cart?")) return;
    setClearing(true);
    try {
      await clearCart();
    } finally {
      setClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.mutedText}>Loading your cart...</p>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>
            <ShoppingCart size={26} />
            Your Cart
          </h1>
          {!isEmpty && (
            <button
              style={{
                ...styles.clearBtn,
                ...(clearing ? styles.disabledBtn : {}),
              }}
              onClick={handleClear}
              disabled={clearing}
            >
              <Trash2 size={14} />
              {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>

        {isEmpty && (
          <div style={styles.emptyWrapper}>
            <div style={styles.emptyIconWrapper}>
              <ShoppingCart size={48} color="#2a2a4a" />
            </div>
            <h2 style={styles.emptyTitle}>Your cart is empty</h2>
            <p style={styles.emptyText}>
              Looks like you haven't added anything yet.
            </p>
            <button style={styles.shopBtn} onClick={() => navigate("/")}>
              Start Shopping
            </button>
          </div>
        )}

        {!isEmpty && cart && (
          <div style={styles.layout}>
            <div style={styles.itemsList}>
              {cart.items.map((item) => {
                const isRemoving = removingId === item.productId;
                const isUpdating = updatingId === item.productId;
                const isBusy = isRemoving || isUpdating;

                return (
                  <div
                    key={item.productId}
                    style={{
                      ...styles.itemCard,
                      ...(isBusy ? styles.itemCardBusy : {}),
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      style={styles.itemImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/100x100?text=No+Image";
                      }}
                    />

                    <div style={styles.itemDetails}>
                      <h3
                        style={styles.itemName}
                        onClick={() => navigate(`/products/${item.productId}`)}
                      >
                        {item.productName}
                      </h3>
                      <p style={styles.itemUnitPrice}>
                        {formatPrice(item.unitPrice)} / item
                      </p>
                    </div>

                    <div style={styles.qtyControls}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() =>
                          handleUpdate(item.productId, item.quantity - 1)
                        }
                        disabled={isBusy || item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={styles.qtyValue}>
                        {isUpdating ? "..." : item.quantity}
                      </span>
                      <button
                        style={styles.qtyBtn}
                        onClick={() =>
                          handleUpdate(item.productId, item.quantity + 1)
                        }
                        disabled={isBusy}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div style={styles.subtotalWrapper}>
                      <span style={styles.subtotal}>
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>

                    <button
                      style={{
                        ...styles.removeBtn,
                        ...(isBusy ? styles.disabledBtn : {}),
                      }}
                      onClick={() => handleRemove(item.productId)}
                      disabled={isBusy}
                      title="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={styles.summary}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              <div style={styles.summaryRows}>
                {cart.items.map((item) => (
                  <div key={item.productId} style={styles.summaryRow}>
                    <span style={styles.summaryItemName}>
                      {item.productName}{" "}
                      <span style={styles.summaryQty}>x {item.quantity}</span>
                    </span>
                    <span style={styles.summaryItemPrice}>
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalValue}>{formatPrice(cart.total)}</span>
              </div>

              <button
                style={styles.checkoutBtn}
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>

              <button style={styles.continueBtn} onClick={() => navigate("/")}>
                <ArrowLeft size={14} />
                Continue Shopping
              </button>
            </div>
          </div>
        )}
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
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
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
  mutedText: { color: "#888", fontSize: 14, margin: 0 },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  clearBtn: {
    backgroundColor: "transparent",
    border: "1px solid #e94560",
    color: "#e94560",
    padding: "7px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  emptyWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: 16,
    textAlign: "center",
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    backgroundColor: "#16213e",
    border: "2px solid #2a2a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
  },
  emptyText: {
    margin: 0,
    fontSize: 15,
    color: "#888",
  },
  shopBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "12px 32px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "inherit",
    transition: "background-color 0.2s",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 28,
    alignItems: "flex-start",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  itemCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    transition: "opacity 0.2s",
  },
  itemCardBusy: {
    opacity: 0.6,
    pointerEvents: "none",
  },
  itemImage: {
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 8,
    flexShrink: 0,
    backgroundColor: "#1a1a2e",
  },
  itemDetails: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "#f0f0f0",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "color 0.2s",
  },
  itemUnitPrice: {
    margin: 0,
    fontSize: 13,
    color: "#888",
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: "6px 10px",
    border: "1px solid #2a2a4a",
    flexShrink: 0,
  },
  qtyBtn: {
    width: 28,
    height: 28,
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
    minWidth: 24,
    textAlign: "center",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
  },
  subtotalWrapper: {
    flexShrink: 0,
    minWidth: 110,
    textAlign: "right",
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e94560",
  },
  removeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#555",
    cursor: "pointer",
    padding: "6px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  summary: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    position: "sticky",
    top: 88,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  summaryTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    paddingBottom: 12,
    borderBottom: "1px solid #2a2a4a",
  },
  summaryRows: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryItemName: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 1.4,
  },
  summaryQty: {
    color: "#888",
    fontSize: 12,
  },
  summaryItemPrice: {
    fontSize: 13,
    color: "#f0f0f0",
    fontWeight: 600,
    flexShrink: 0,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#2a2a4a",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#e94560",
  },
  checkoutBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "13px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background-color 0.2s",
    marginTop: 4,
  },
  continueBtn: {
    backgroundColor: "transparent",
    color: "#aaa",
    border: "1px solid #2a2a4a",
    padding: "10px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "all 0.2s",
  },
};
