import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, type Order } from "../api/orders";
import {
  Package,
  Landmark,
  CreditCard,
  Smartphone,
  Banknote,
  ChevronDown,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  bank_transfer: <Landmark size={13} />,
  credit_card: <CreditCard size={13} />,
  e_wallet: <Smartphone size={13} />,
  cod: <Banknote size={13} />,
};

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  e_wallet: "E-Wallet",
  cod: "Cash on Delivery",
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    ordersApi
      .getOrders()
      .then(setOrders)
      .catch(() => setError("Failed to load orders. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status.toLowerCase()) {
      case "paid":
        return { backgroundColor: "rgba(39,174,96,0.2)", color: "#27ae60" };
      case "shipped":
        return { backgroundColor: "rgba(52,152,219,0.2)", color: "#3498db" };
      case "delivered":
        return { backgroundColor: "rgba(39,174,96,0.3)", color: "#2ecc71" };
      case "cancelled":
        return { backgroundColor: "rgba(233,69,96,0.2)", color: "#e94560" };
      default:
        return { backgroundColor: "rgba(243,156,18,0.2)", color: "#f39c12" };
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.mutedText}>Loading your orders...</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.fullCenter}>
        <AlertTriangle size={40} color="#e94560" />
        <p style={styles.errorText}>{error}</p>
        <button
          style={styles.actionBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.emptyIconWrapper}>
          <Package size={44} color="#2a2a4a" />
        </div>
        <h2 style={styles.emptyTitle}>No orders yet</h2>
        <p style={styles.mutedText}>
          You haven't placed any orders. Start shopping!
        </p>
        <button style={styles.actionBtn} onClick={() => navigate("/")}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>
              <Package size={24} />
              My Orders
            </h1>
            <p style={styles.pageSubtitle}>
              {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            </p>
          </div>
          <button style={styles.shopMoreBtn} onClick={() => navigate("/")}>
            <ShoppingBag size={15} />
            Shop More
          </button>
        </div>

        {/* Orders list */}
        <div style={styles.ordersList}>
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const paymentLabel =
              PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
            const PayIcon = PAYMENT_ICONS[order.paymentMethod] ?? (
              <CreditCard size={13} />
            );

            return (
              <div key={order.id} style={styles.orderCard}>
                {/* Order header row */}
                <div
                  style={styles.orderHeader}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div style={styles.orderHeaderLeft}>
                    <div style={styles.orderIdRow}>
                      <span style={styles.orderIdLabel}>Order</span>
                      <span style={styles.orderId}>#{order.id}</span>
                    </div>
                    <span style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div style={styles.orderHeaderCenter}>
                    <span style={styles.paymentMethodText}>
                      <span style={styles.paymentIconWrapper}>{PayIcon}</span>
                      {paymentLabel}
                    </span>
                    <span style={styles.itemCountText}>
                      {order.items.reduce((s, i) => s + i.quantity, 0)} item
                      {order.items.reduce((s, i) => s + i.quantity, 0) !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div style={styles.orderHeaderRight}>
                    <span style={styles.orderTotal}>
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(order.status),
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.chevron,
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <ChevronDown size={18} color="#555" />
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={styles.orderBody}>
                    <div style={styles.orderBodyDivider} />

                    <div style={styles.itemsGrid}>
                      {order.items.map((item) => (
                        <div key={item.productId} style={styles.itemRow}>
                          <div style={styles.itemInfo}>
                            <span style={styles.itemName}>
                              {item.productName}
                            </span>
                            <span style={styles.itemMeta}>
                              {formatPrice(item.unitPrice)} x {item.quantity}
                            </span>
                          </div>
                          <span style={styles.itemSubtotal}>
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={styles.orderBodyDivider} />

                    {/* Summary row */}
                    <div style={styles.orderSummaryRow}>
                      <div style={styles.orderSummaryLeft}>
                        <div style={styles.summaryDetail}>
                          <span style={styles.summaryDetailLabel}>
                            Payment Method
                          </span>
                          <span style={styles.summaryDetailValue}>
                            <span style={styles.paymentIconWrapper}>
                              {PayIcon}
                            </span>
                            {paymentLabel}
                          </span>
                        </div>
                        <div style={styles.summaryDetail}>
                          <span style={styles.summaryDetailLabel}>Status</span>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...getStatusStyle(order.status),
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div style={styles.orderSummaryRight}>
                        <span style={styles.totalLabel}>Order Total</span>
                        <span style={styles.totalValue}>
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
    maxWidth: 900,
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
    minHeight: "70vh",
    gap: 16,
    backgroundColor: "#0f3460",
    color: "#f0f0f0",
    padding: "24px",
    textAlign: "center",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #2a2a4a",
    borderTop: "4px solid #e94560",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  mutedText: {
    color: "#888",
    fontSize: 14,
    margin: 0,
  },
  errorText: {
    color: "#e94560",
    fontSize: 15,
    margin: 0,
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
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
  },
  actionBtn: {
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
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: {
    margin: "0 0 4px",
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#888",
  },
  shopMoreBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "background-color 0.2s",
    flexShrink: 0,
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  orderCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    border: "1px solid #2a2a4a",
    transition: "border-color 0.2s",
  },
  orderHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "18px 20px",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.2s",
  },
  orderHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 130,
  },
  orderIdRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
  },
  orderHeaderCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 13,
    color: "#ccc",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  paymentIconWrapper: {
    display: "inline-flex",
    alignItems: "center",
  },
  itemCountText: {
    fontSize: 12,
    color: "#888",
  },
  orderHeaderRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: 800,
    color: "#e94560",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  chevron: {
    transition: "transform 0.25s ease",
    flexShrink: 0,
    userSelect: "none",
    display: "flex",
    alignItems: "center",
  },
  orderBody: {
    padding: "0 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  orderBodyDivider: {
    height: 1,
    backgroundColor: "#2a2a4a",
  },
  itemsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 14px",
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f0f0f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemMeta: {
    fontSize: 12,
    color: "#888",
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e94560",
    flexShrink: 0,
  },
  orderSummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  orderSummaryLeft: {
    display: "flex",
    gap: 24,
  },
  summaryDetail: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  summaryDetailLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDetailValue: {
    fontSize: 13,
    color: "#ccc",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  orderSummaryRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#e94560",
  },
};
