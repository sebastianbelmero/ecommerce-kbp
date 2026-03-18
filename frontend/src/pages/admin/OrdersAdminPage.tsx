import { useEffect, useState, useCallback } from "react";
import { adminApi, type AdminOrder, type AdminOrdersResponse } from "../../api/admin";
import { Landmark, CreditCard, Smartphone, Banknote, ClipboardList, CheckCircle, AlertTriangle, Package } from "lucide-react";

const STATUS_OPTIONS = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  bank_transfer: <Landmark size={14} />,
  credit_card: <CreditCard size={14} />,
  e_wallet: <Smartphone size={14} />,
  cod: <Banknote size={14} />,
};

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  e_wallet: "E-Wallet",
  cod: "COD",
};

export default function AdminOrdersPage() {
  const [ordersData, setOrdersData] = useState<AdminOrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Expanded row
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Status update
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllOrders(filterStatus || undefined, page, pageSize);
      setOrdersData(data);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filterStatus]);

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
      case "paid":      return { backgroundColor: "rgba(39,174,96,0.2)",  color: "#27ae60" };
      case "shipped":   return { backgroundColor: "rgba(52,152,219,0.2)", color: "#3498db" };
      case "delivered": return { backgroundColor: "rgba(39,174,96,0.3)",  color: "#2ecc71" };
      case "cancelled": return { backgroundColor: "rgba(233,69,96,0.2)",  color: "#e94560" };
      default:          return { backgroundColor: "rgba(243,156,18,0.2)", color: "#f39c12" };
    }
  };

  const handleStatusChange = async (order: AdminOrder, newStatus: string) => {
    if (order.status === newStatus) return;

    setUpdatingId(order.id);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await adminApi.updateOrderStatus(order.id, newStatus);
      setUpdateSuccess(res.message);
      setTimeout(() => setUpdateSuccess(null), 3000);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update order status.";
      setUpdateError(msg);
      setTimeout(() => setUpdateError(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const orders = ordersData?.data ?? [];
  const totalPages = ordersData?.totalPages ?? 1;
  const total = ordersData?.total ?? 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}><ClipboardList size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />Orders</h1>
            <p style={styles.pageSubtitle}>
              {total} order{total !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Filter by Status:</span>
            <div style={styles.statusFilters}>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filterStatus === "" ? styles.filterBtnActive : {}),
                }}
                onClick={() => setFilterStatus("")}
              >
                All
              </button>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  style={{
                    ...styles.filterBtn,
                    ...(filterStatus === s ? styles.filterBtnActive : {}),
                    ...(filterStatus === s ? {} : getStatusStyle(s)),
                  }}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toast messages */}
        {updateSuccess && (
          <div style={styles.successBox}><CheckCircle size={14} style={{ marginRight: 6, flexShrink: 0 }} />{updateSuccess}</div>
        )}
        {updateError && (
          <div style={styles.errorBox}><AlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} />{updateError}</div>
        )}
        {error && !isLoading && (
          <div style={styles.errorBox}>
            <AlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} />{error}{" "}
            <button style={styles.inlineRetry} onClick={load}>
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.mutedText}>Loading orders...</p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <>
            {orders.length === 0 ? (
              <div style={styles.emptyBox}>
                <Package size={56} style={{ color: "#555" }} />
                <p style={styles.mutedText}>No orders found.</p>
              </div>
            ) : (
              <div style={styles.ordersList}>
                {orders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const isUpdating = updatingId === order.id;

                  return (
                    <div key={order.id} style={styles.orderCard}>
                      {/* ── Order Header Row ────────────────────────── */}
                      <div style={styles.orderHeader}>
                        {/* Toggle expand */}
                        <div
                          style={styles.orderHeaderMain}
                          onClick={() => toggleExpand(order.id)}
                        >
                          {/* Order ID + Date */}
                          <div style={styles.orderIdCol}>
                            <span style={styles.orderId}>#{order.id}</span>
                            <span style={styles.orderDate}>
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          {/* Customer */}
                          <div style={styles.customerCol}>
                            <span style={styles.customerName}>
                              {order.username}
                            </span>
                            <span style={styles.customerEmail}>
                              {order.email}
                            </span>
                          </div>

                          {/* Payment + Items */}
                          <div style={styles.paymentCol}>
                            <span style={{ ...styles.paymentText, display: "flex", alignItems: "center", gap: 6 }}>
                              {PAYMENT_ICONS[order.paymentMethod]}
                              {PAYMENT_LABELS[order.paymentMethod] ??
                                order.paymentMethod}
                            </span>
                            <span style={styles.itemCount}>
                              {order.items.reduce(
                                (s, i) => s + i.quantity,
                                0
                              )}{" "}
                              item(s)
                            </span>
                          </div>

                          {/* Amount */}
                          <div style={styles.amountCol}>
                            <span style={styles.amount}>
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>

                          {/* Chevron */}
                          <div
                            style={{
                              ...styles.chevron,
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          >
                            ▾
                          </div>
                        </div>

                        {/* Status selector — outside click area */}
                        <div
                          style={styles.statusCell}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isUpdating ? (
                            <div style={styles.updatingRow}>
                              <div style={styles.miniSpinner} />
                              <span style={styles.updatingText}>Updating...</span>
                            </div>
                          ) : (
                            <select
                              style={{
                                ...styles.statusSelect,
                                ...getStatusStyle(order.status),
                              }}
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order, e.target.value)
                              }
                              disabled={isUpdating}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* ── Expanded: Order Items ────────────────────── */}
                      {isExpanded && (
                        <div style={styles.orderBody}>
                          <div style={styles.divider} />

                          <h4 style={styles.itemsTitle}>Order Items</h4>

                          <div style={styles.itemsTable}>
                            <div style={styles.itemsHeader}>
                              <span style={styles.itemsHeaderCell}>Product</span>
                              <span
                                style={{
                                  ...styles.itemsHeaderCell,
                                  textAlign: "center",
                                }}
                              >
                                Qty
                              </span>
                              <span
                                style={{
                                  ...styles.itemsHeaderCell,
                                  textAlign: "right",
                                }}
                              >
                                Unit Price
                              </span>
                              <span
                                style={{
                                  ...styles.itemsHeaderCell,
                                  textAlign: "right",
                                }}
                              >
                                Subtotal
                              </span>
                            </div>

                            {order.items.map((item) => (
                              <div key={item.productId} style={styles.itemRow}>
                                <span style={styles.itemName}>
                                  {item.productName}
                                </span>
                                <span
                                  style={{
                                    ...styles.itemCell,
                                    textAlign: "center",
                                  }}
                                >
                                  {item.quantity}
                                </span>
                                <span
                                  style={{
                                    ...styles.itemCell,
                                    textAlign: "right",
                                  }}
                                >
                                  {formatPrice(item.unitPrice)}
                                </span>
                                <span
                                  style={{
                                    ...styles.itemCell,
                                    textAlign: "right",
                                    color: "#e94560",
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatPrice(item.subtotal)}
                                </span>
                              </div>
                            ))}

                            {/* Total row */}
                            <div style={styles.totalRow}>
                              <span style={styles.totalLabel}>Total</span>
                              <span style={styles.totalValue}>
                                {formatPrice(order.totalAmount)}
                              </span>
                            </div>
                          </div>

                          {/* Order meta */}
                          <div style={styles.orderMeta}>
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Customer ID</span>
                              <span style={styles.metaValue}>#{order.userId}</span>
                            </div>
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Email</span>
                              <span style={styles.metaValue}>{order.email}</span>
                            </div>
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Payment</span>
                              <span style={{ ...styles.metaValue, display: "flex", alignItems: "center", gap: 6 }}>
                                {PAYMENT_ICONS[order.paymentMethod]}
                                {PAYMENT_LABELS[order.paymentMethod] ??
                                  order.paymentMethod}
                              </span>
                            </div>
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Order Date</span>
                              <span style={styles.metaValue}>
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{
                    ...styles.pageBtn,
                    ...(page <= 1 ? styles.pageBtnDisabled : {}),
                  }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 2
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`dots-${idx}`} style={styles.pageDots}>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        style={{
                          ...styles.pageBtn,
                          ...(page === item ? styles.pageBtnActive : {}),
                        }}
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  style={{
                    ...styles.pageBtn,
                    ...(page >= totalPages ? styles.pageBtnDisabled : {}),
                  }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next →
                </button>

                <span style={styles.pageInfo}>
                  Page {page} of {totalPages} ({total} orders)
                </span>
              </div>
            )}
          </>
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
    padding: "36px 0 80px",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: {
    margin: "0 0 4px",
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#888",
  },
  filterBar: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: "16px 20px",
    border: "1px solid #2a2a4a",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#888",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusFilters: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "5px 14px",
    borderRadius: 20,
    border: "1.5px solid #2a2a4a",
    backgroundColor: "transparent",
    color: "#aaa",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
    color: "#fff",
  },
  successBox: {
    backgroundColor: "rgba(39,174,96,0.15)",
    border: "1px solid rgba(39,174,96,0.4)",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#27ae60",
    fontWeight: 600,
  },
  errorBox: {
    backgroundColor: "rgba(233,69,96,0.15)",
    border: "1px solid #e94560",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#e94560",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  inlineRetry: {
    marginLeft: "auto",
    backgroundColor: "transparent",
    border: "1px solid #e94560",
    color: "#e94560",
    padding: "3px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: 14,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #2a2a4a",
    borderTop: "4px solid #e94560",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  mutedText: { color: "#888", fontSize: 14, margin: 0 },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    padding: "80px 0",
    backgroundColor: "#16213e",
    borderRadius: 14,
    border: "1px solid #2a2a4a",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  orderCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    border: "1px solid #2a2a4a",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    transition: "border-color 0.2s",
  },
  orderHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
  },
  orderHeaderMain: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    minWidth: 0,
  },
  orderIdCol: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 80,
    flexShrink: 0,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
  },
  orderDate: {
    fontSize: 11,
    color: "#666",
    whiteSpace: "nowrap",
  },
  customerCol: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 140,
    flex: 1,
    overflow: "hidden",
  },
  customerName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f0f0f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  customerEmail: {
    fontSize: 12,
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  paymentCol: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 120,
    flexShrink: 0,
  },
  paymentText: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  itemCount: {
    fontSize: 11,
    color: "#666",
  },
  amountCol: {
    flexShrink: 0,
    minWidth: 110,
    textAlign: "right" as const,
  },
  amount: {
    fontSize: 16,
    fontWeight: 800,
    color: "#e94560",
    whiteSpace: "nowrap",
  },
  chevron: {
    color: "#555",
    fontSize: 18,
    transition: "transform 0.25s ease",
    flexShrink: 0,
    userSelect: "none" as const,
  },
  statusCell: {
    flexShrink: 0,
    minWidth: 130,
  },
  statusSelect: {
    width: "100%",
    padding: "6px 10px",
    borderRadius: 8,
    border: "1.5px solid currentColor",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    outline: "none",
    appearance: "auto" as unknown as undefined,
    backgroundColor: "transparent",
    transition: "all 0.2s",
  },
  updatingRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  miniSpinner: {
    width: 16,
    height: 16,
    border: "2px solid #2a2a4a",
    borderTop: "2px solid #e94560",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  updatingText: {
    fontSize: 12,
    color: "#888",
  },
  // ── Expanded body ──────────────────────────────────────────────────────────
  orderBody: {
    padding: "0 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a4a",
  },
  itemsTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  itemsTable: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #2a2a4a",
  },
  itemsHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 140px 140px",
    padding: "10px 16px",
    backgroundColor: "#1a2547",
    borderBottom: "1px solid #2a2a4a",
  },
  itemsHeaderCell: {
    fontSize: 11,
    fontWeight: 700,
    color: "#777",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  itemRow: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 140px 140px",
    padding: "11px 16px",
    borderBottom: "1px solid #1a2547",
    alignItems: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f0f0f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    paddingRight: 8,
  },
  itemCell: {
    fontSize: 13,
    color: "#ccc",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "rgba(233,69,96,0.05)",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#aaa",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 800,
    color: "#e94560",
  },
  orderMeta: {
    display: "flex",
    gap: 24,
    flexWrap: "wrap" as const,
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: "14px 18px",
    border: "1px solid #2a2a4a",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  metaValue: {
    fontSize: 13,
    color: "#ccc",
    fontWeight: 500,
  },
  // ── Pagination ─────────────────────────────────────────────────────────────
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap" as const,
    paddingTop: 8,
  },
  pageBtn: {
    backgroundColor: "#16213e",
    border: "1.5px solid #2a2a4a",
    color: "#ccc",
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  },
  pageBtnActive: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
    color: "#fff",
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  pageDots: {
    color: "#555",
    fontSize: 14,
    padding: "0 4px",
  },
  pageInfo: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    whiteSpace: "nowrap" as const,
  },
};
