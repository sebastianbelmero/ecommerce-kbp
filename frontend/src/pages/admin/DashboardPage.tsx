import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, type DashboardStats } from "../../api/admin";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ChevronRight,
  Plus,
  ClipboardList,
  FolderOpen,
  User,
  Clock,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  e_wallet: "E-Wallet",
  cod: "Cash on Delivery",
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(setStats)
      .catch(() => setError("Failed to load dashboard data."))
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
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  if (isLoading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.mutedText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={styles.fullCenter}>
        <AlertTriangle size={40} color="#e94560" />
        <p style={{ color: "#e94560", margin: 0 }}>
          {error ?? "Something went wrong."}
        </p>
        <button
          style={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString("id-ID"),
      Icon: Users,
      color: "#3498db",
      action: () => navigate("/admin/users"),
    },
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString("id-ID"),
      Icon: Package,
      color: "#9b59b6",
      action: () => navigate("/admin/products"),
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString("id-ID"),
      Icon: ShoppingCart,
      color: "#e67e22",
      action: () => navigate("/admin/orders"),
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      Icon: DollarSign,
      color: "#27ae60",
      action: undefined,
    },
  ];

  const quickActions = [
    {
      label: "Add New Product",
      Icon: Plus,
      to: "/admin/products",
      color: "#e94560",
    },
    {
      label: "View All Orders",
      Icon: ClipboardList,
      to: "/admin/orders",
      color: "#3498db",
    },
    {
      label: "Manage Products",
      Icon: FolderOpen,
      to: "/admin/products",
      color: "#9b59b6",
    },
    { label: "Manage Users", Icon: User, to: "/admin/users", color: "#27ae60" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Welcome back, Admin. Here's what's happening.
            </p>
          </div>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot} />
            Live
          </div>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                ...styles.statCard,
                ...(card.action ? styles.statCardClickable : {}),
              }}
              onClick={card.action}
            >
              <div
                style={{
                  ...styles.statIconWrapper,
                  backgroundColor: card.color + "22",
                }}
              >
                <card.Icon size={22} color={card.color} />
              </div>
              <div style={styles.statInfo}>
                <span style={styles.statLabel}>{card.label}</span>
                <span style={{ ...styles.statValue, color: card.color }}>
                  {card.value}
                </span>
              </div>
              {card.action && <ChevronRight size={18} color="#555" />}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Zap size={18} color="#e94560" />
              Quick Actions
            </h2>
          </div>
          <div style={styles.actionsGrid}>
            {quickActions.map(({ label, Icon, to, color }) => (
              <button
                key={label}
                style={{ ...styles.actionBtn, borderColor: color + "55" }}
                onClick={() => navigate(to)}
              >
                <div
                  style={{
                    ...styles.actionBtnIconWrapper,
                    backgroundColor: color + "18",
                  }}
                >
                  <Icon size={22} color={color} />
                </div>
                <span style={{ ...styles.actionBtnLabel, color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Clock size={18} color="#3498db" />
              Recent Orders
            </h2>
            <button
              style={styles.viewAllBtn}
              onClick={() => navigate("/admin/orders")}
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={styles.mutedText}>No orders yet.</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      "Order ID",
                      "Customer",
                      "Amount",
                      "Payment",
                      "Status",
                      "Date",
                    ].map((h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      style={{
                        ...styles.tr,
                        backgroundColor: idx % 2 === 0 ? "#16213e" : "#1a2547",
                      }}
                      onClick={() => navigate("/admin/orders")}
                    >
                      <td style={styles.td}>
                        <span style={styles.orderId}>#{order.id}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.usernameText}>
                          {order.username}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.amount}>
                          {formatPrice(order.totalAmount)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.paymentMethod}>
                          {PAYMENT_LABELS[order.paymentMethod] ??
                            order.paymentMethod}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...getStatusStyle(order.status),
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.date}>
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    padding: "36px 0 80px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
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
  retryBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: {
    margin: "0 0 6px",
    fontSize: 30,
    fontWeight: 800,
    color: "#fff",
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#888",
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(39,174,96,0.15)",
    border: "1px solid rgba(39,174,96,0.4)",
    color: "#27ae60",
    fontSize: 13,
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#27ae60",
    display: "inline-block",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 20,
  },
  statCard: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: "20px 22px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    border: "1px solid #2a2a4a",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  statCardClickable: {
    cursor: "pointer",
  },
  statIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  viewAllBtn: {
    backgroundColor: "transparent",
    border: "1px solid #2a2a4a",
    color: "#e94560",
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.2s",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 14,
  },
  actionBtn: {
    backgroundColor: "#16213e",
    border: "1.5px solid",
    borderRadius: 12,
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "transform 0.15s, background-color 0.2s",
  },
  actionBtnIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },
  tableWrapper: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    border: "1px solid #2a2a4a",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    minWidth: 700,
  },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#888",
    backgroundColor: "#1a2547",
    borderBottom: "1px solid #2a2a4a",
    whiteSpace: "nowrap",
  },
  tr: {
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #1a2547",
    verticalAlign: "middle",
  },
  orderId: {
    fontWeight: 700,
    color: "#fff",
  },
  usernameText: {
    color: "#ccc",
    fontWeight: 500,
  },
  amount: {
    fontWeight: 700,
    color: "#e94560",
  },
  paymentMethod: {
    color: "#aaa",
    fontSize: 13,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  date: {
    color: "#666",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  emptyBox: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #2a2a4a",
  },
};
