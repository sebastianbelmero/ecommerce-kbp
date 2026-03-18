import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { ordersApi, type CheckoutResponse } from "../api/orders";
import {
  Landmark,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  Loader2,
  Package,
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    Icon: Landmark,
    description: "Transfer via BCA, Mandiri, BNI, BRI",
  },
  {
    id: "credit_card",
    label: "Credit Card",
    Icon: CreditCard,
    description: "Visa, Mastercard, JCB",
  },
  {
    id: "e_wallet",
    label: "E-Wallet",
    Icon: Smartphone,
    description: "GoPay, OVO, DANA, ShopeePay",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    Icon: Banknote,
    description: "Pay when your order arrives",
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, isLoading: cartLoading } = useCart();

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResponse | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPayment) {
      setError("Please select a payment method.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout({
        paymentMethod: selectedPayment,
      });
      setOrderResult(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Checkout failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (cartLoading) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.spinner} />
        <p style={styles.mutedText}>Loading checkout...</p>
      </div>
    );
  }

  // ── Order Success ──────────────────────────────────────────────────────────
  if (orderResult) {
    const paymentMethod = PAYMENT_METHODS.find(
      (p) => p.id === orderResult.paymentMethod,
    );
    const PayIcon = paymentMethod?.Icon ?? Receipt;

    return (
      <div style={styles.fullCenter}>
        <div style={styles.successCard}>
          <div style={styles.successIconWrapper}>
            <CheckCircle size={52} color="#27ae60" />
          </div>
          <h1 style={styles.successTitle}>Order Placed!</h1>
          <p style={styles.successSubtitle}>
            Thank you for your purchase. Your order has been received.
          </p>

          <div style={styles.receiptBox}>
            <div style={styles.receiptRow}>
              <span style={styles.receiptLabel}>Order ID</span>
              <span style={styles.receiptValue}>#{orderResult.orderId}</span>
            </div>
            <div style={styles.receiptDivider} />
            <div style={styles.receiptRow}>
              <span style={styles.receiptLabel}>Payment Method</span>
              <span
                style={{
                  ...styles.receiptValue,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <PayIcon size={14} />
                {paymentMethod?.label ?? orderResult.paymentMethod}
              </span>
            </div>
            <div style={styles.receiptDivider} />
            <div style={styles.receiptRow}>
              <span style={styles.receiptLabel}>Total Amount</span>
              <span
                style={{
                  ...styles.receiptValue,
                  color: "#e94560",
                  fontWeight: 800,
                }}
              >
                {formatPrice(orderResult.totalAmount)}
              </span>
            </div>
            <div style={styles.receiptDivider} />
            <div style={styles.receiptRow}>
              <span style={styles.receiptLabel}>Status</span>
              <span style={styles.statusBadge}>{orderResult.status}</span>
            </div>
          </div>

          <div style={styles.successActions}>
            <button
              style={styles.viewOrdersBtn}
              onClick={() => navigate("/orders")}
            >
              View My Orders
            </button>
            <button
              style={styles.continueShoppingBtn}
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty Cart ─────────────────────────────────────────────────────────────
  if (!cart || cart.items.length === 0) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.emptyIconWrapper}>
          <ShoppingBag size={40} color="#2a2a4a" />
        </div>
        <h2 style={{ color: "#fff", margin: 0 }}>Nothing to checkout</h2>
        <p style={styles.mutedText}>Add some products to your cart first.</p>
        <button style={styles.viewOrdersBtn} onClick={() => navigate("/")}>
          Browse Products
        </button>
      </div>
    );
  }

  // ── Checkout Form ──────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <span style={styles.breadcrumbLink} onClick={() => navigate("/")}>
            Home
          </span>
          <span style={styles.breadcrumbSep}>›</span>
          <span style={styles.breadcrumbLink} onClick={() => navigate("/cart")}>
            Cart
          </span>
          <span style={styles.breadcrumbSep}>›</span>
          <span style={styles.breadcrumbCurrent}>Checkout</span>
        </div>

        <h1 style={styles.pageTitle}>Checkout</h1>

        <div style={styles.layout}>
          {/* LEFT: form */}
          <form onSubmit={handleSubmit} style={styles.formSection}>
            {/* Order Items */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>
                <Package size={17} />
                Order Items
              </h2>
              <div style={styles.orderItemsList}>
                {cart.items.map((item) => (
                  <div key={item.productId} style={styles.orderItem}>
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      style={styles.orderItemImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/60x60?text=N/A";
                      }}
                    />
                    <div style={styles.orderItemInfo}>
                      <span style={styles.orderItemName}>
                        {item.productName}
                      </span>
                      <span style={styles.orderItemQty}>
                        {formatPrice(item.unitPrice)} x {item.quantity}
                      </span>
                    </div>
                    <span style={styles.orderItemSubtotal}>
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>
                <CreditCard size={17} />
                Payment Method
              </h2>
              <p style={styles.sectionSubtitle}>
                Select how you would like to pay for your order.
              </p>

              <div style={styles.paymentGrid}>
                {PAYMENT_METHODS.map(({ id, label, Icon, description }) => {
                  const isSelected = selectedPayment === id;
                  return (
                    <label
                      key={id}
                      style={{
                        ...styles.paymentOption,
                        ...(isSelected ? styles.paymentOptionSelected : {}),
                      }}
                      onClick={() => setSelectedPayment(id)}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={isSelected}
                        onChange={() => setSelectedPayment(id)}
                        style={{ display: "none" }}
                      />
                      <div style={styles.paymentIconWrapper}>
                        <Icon
                          size={22}
                          color={isSelected ? "#e94560" : "#888"}
                        />
                      </div>
                      <div style={styles.paymentInfo}>
                        <span style={styles.paymentLabel}>{label}</span>
                        <span style={styles.paymentDesc}>{description}</span>
                      </div>
                      {isSelected && (
                        <div style={styles.paymentCheck}>
                          <CheckCircle size={18} color="#e94560" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.placeOrderBtn,
                ...(isSubmitting || !selectedPayment
                  ? styles.placeOrderBtnDisabled
                  : {}),
              }}
              disabled={isSubmitting || !selectedPayment}
            >
              {isSubmitting ? (
                <span style={styles.loadingRow}>
                  <Loader2
                    size={17}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                  Placing Order...
                </span>
              ) : (
                `Place Order · ${formatPrice(cart.total)}`
              )}
            </button>

            <button
              type="button"
              style={styles.backToCartBtn}
              onClick={() => navigate("/cart")}
              disabled={isSubmitting}
            >
              <ArrowLeft size={15} />
              Back to Cart
            </button>
          </form>

          {/* RIGHT: Summary */}
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            <div style={styles.summaryRows}>
              {cart.items.map((item) => (
                <div key={item.productId} style={styles.summaryRow}>
                  <span style={styles.summaryName}>
                    {item.productName}
                    <span style={styles.summaryQty}> x{item.quantity}</span>
                  </span>
                  <span style={styles.summaryPrice}>
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.summaryDivider} />

            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Subtotal</span>
              <span style={styles.summaryValue}>{formatPrice(cart.total)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Shipping</span>
              <span
                style={{
                  ...styles.summaryValue,
                  color: "#27ae60",
                  fontWeight: 700,
                }}
              >
                FREE
              </span>
            </div>

            <div style={styles.summaryDivider} />

            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalValue}>{formatPrice(cart.total)}</span>
            </div>

            {selectedPayment &&
              (() => {
                const method = PAYMENT_METHODS.find(
                  (p) => p.id === selectedPayment,
                );
                if (!method) return null;
                const { Icon: SelIcon, label } = method;
                return (
                  <div style={styles.selectedPaymentBadge}>
                    <span style={styles.selectedPaymentLabel}>Paying with</span>
                    <span style={styles.selectedPaymentValue}>
                      <SelIcon size={14} />
                      {label}
                    </span>
                  </div>
                );
              })()}
          </div>
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
    maxWidth: 1050,
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
    minHeight: "80vh",
    gap: 20,
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
  mutedText: { color: "#888", fontSize: 14, margin: 0 },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#888",
  },
  breadcrumbLink: {
    color: "#e94560",
    cursor: "pointer",
    textDecoration: "underline",
  },
  breadcrumbSep: { color: "#555" },
  breadcrumbCurrent: { color: "#ccc" },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 28,
    alignItems: "flex-start",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  sectionCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    paddingBottom: 12,
    borderBottom: "1px solid #2a2a4a",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionSubtitle: {
    margin: "-8px 0 0",
    fontSize: 13,
    color: "#888",
  },
  orderItemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  orderItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "10px 14px",
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
  },
  orderItemImage: {
    width: 52,
    height: 52,
    objectFit: "cover",
    borderRadius: 6,
    flexShrink: 0,
    backgroundColor: "#0f3460",
  },
  orderItemInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f0f0f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  orderItemQty: {
    fontSize: 12,
    color: "#888",
  },
  orderItemSubtotal: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e94560",
    flexShrink: 0,
  },
  paymentGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  paymentOption: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    backgroundColor: "#1a1a2e",
    border: "2px solid #2a2a4a",
    borderRadius: 10,
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    position: "relative",
    userSelect: "none",
  },
  paymentOptionSelected: {
    borderColor: "#e94560",
    backgroundColor: "rgba(233,69,96,0.08)",
  },
  paymentIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#16213e",
    border: "1px solid #2a2a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  paymentInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f0f0f0",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#888",
  },
  paymentCheck: {
    flexShrink: 0,
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
    gap: 8,
  },
  placeOrderBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "15px",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    transition: "background-color 0.2s",
  },
  placeOrderBtnDisabled: {
    backgroundColor: "#555",
    cursor: "not-allowed",
  },
  backToCartBtn: {
    backgroundColor: "transparent",
    color: "#aaa",
    border: "1px solid #2a2a4a",
    padding: "11px",
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
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
    paddingBottom: 12,
    borderBottom: "1px solid #2a2a4a",
  },
  summaryRows: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  summaryName: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 1.4,
  },
  summaryQty: {
    color: "#888",
    fontSize: 12,
  },
  summaryPrice: {
    fontSize: 13,
    color: "#f0f0f0",
    fontWeight: 600,
    flexShrink: 0,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#2a2a4a",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: 14,
    color: "#f0f0f0",
    fontWeight: 600,
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
  selectedPaymentBadge: {
    backgroundColor: "rgba(233,69,96,0.1)",
    border: "1px solid rgba(233,69,96,0.3)",
    borderRadius: 8,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 4,
  },
  selectedPaymentLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: 600,
  },
  selectedPaymentValue: {
    fontSize: 14,
    color: "#f0f0f0",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  // ── Success screen ─────────────────────────────────────────────────────────
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    backgroundColor: "#16213e",
    border: "2px solid #2a2a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: "48px 40px",
    maxWidth: 500,
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
  },
  successIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    backgroundColor: "rgba(39,174,96,0.12)",
    border: "1.5px solid rgba(39,174,96,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  successSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#aaa",
    lineHeight: 1.6,
  },
  receiptBox: {
    backgroundColor: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 10,
    padding: "16px 20px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
    boxSizing: "border-box",
  },
  receiptRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: 600,
  },
  receiptValue: {
    fontSize: 14,
    color: "#f0f0f0",
    fontWeight: 700,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#2a2a4a",
  },
  statusBadge: {
    backgroundColor: "rgba(39,174,96,0.2)",
    color: "#27ae60",
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 12px",
    borderRadius: 20,
  },
  successActions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  viewOrdersBtn: {
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
    transition: "background-color 0.2s",
  },
  continueShoppingBtn: {
    backgroundColor: "transparent",
    color: "#aaa",
    border: "1px solid #2a2a4a",
    padding: "11px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
};
