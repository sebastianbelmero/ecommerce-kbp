import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type { Product } from "../../api/products";
import type { CreateProductPayload } from "../../api/admin";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  AlertTriangle,
  Image,
} from "lucide-react";

const EMPTY_FORM: CreateProductPayload = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  imageUrl: "",
};

type ModalMode = "create" | "edit" | null;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllProducts();
      setProducts(data);
    } catch {
      setError("Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditingProduct(null);
    setModalMode("create");
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
    });
    setFormError(null);
    setEditingProduct(product);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProduct(null);
    setFormError(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "stockQuantity" ? Number(value) : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return "Product name is required.";
    if (form.price <= 0) return "Price must be greater than 0.";
    if (form.stockQuantity < 0) return "Stock quantity cannot be negative.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        await adminApi.createProduct(form);
      } else if (modalMode === "edit" && editingProduct) {
        await adminApi.updateProduct(editingProduct.id, form);
      }
      closeModal();
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save product.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !window.confirm(`Delete "${product.name}"? This action cannot be undone.`)
    )
      return;

    setDeletingId(product.id);
    setDeleteError(null);
    try {
      await adminApi.deleteProduct(product.id);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete product.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>
              <Package size={24} />
              Products
            </h1>
            <p style={styles.pageSubtitle}>
              {products.length} product{products.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button style={styles.createBtn} onClick={openCreate}>
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchWrapper}>
          <Search size={15} color="#888" style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search products by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Global delete error */}
        {deleteError && (
          <div style={styles.errorBox}>
            <AlertTriangle size={15} />
            {deleteError}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.mutedText}>Loading products...</p>
          </div>
        )}

        {/* Fetch error */}
        {error && !isLoading && (
          <div style={styles.errorBox}>
            <AlertTriangle size={15} />
            {error}
            <button style={styles.inlineRetry} onClick={load}>
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            {filtered.length === 0 ? (
              <div style={styles.center}>
                <Package size={48} color="#2a2a4a" />
                <p style={styles.mutedText}>
                  {search
                    ? "No products match your search."
                    : "No products yet."}
                </p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {[
                        "#",
                        "Image",
                        "Name",
                        "Price",
                        "Stock",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th key={h} style={styles.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product, idx) => {
                      const isDeleting = deletingId === product.id;
                      const outOfStock = product.stockQuantity === 0;
                      const lowStock =
                        product.stockQuantity > 0 && product.stockQuantity <= 5;

                      return (
                        <tr
                          key={product.id}
                          style={{
                            ...styles.tr,
                            backgroundColor:
                              idx % 2 === 0 ? "#16213e" : "#1a2547",
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                        >
                          <td style={styles.td}>
                            <span style={styles.idText}>#{product.id}</span>
                          </td>
                          <td style={styles.td}>
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              style={styles.productImg}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/60x60?text=N/A";
                              }}
                            />
                          </td>
                          <td style={styles.td}>
                            <div style={styles.productInfo}>
                              <span style={styles.productName}>
                                {product.name}
                              </span>
                              <span style={styles.productDesc}>
                                {product.description.length > 60
                                  ? product.description.slice(0, 60) + "…"
                                  : product.description}
                              </span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.priceText}>
                              {formatPrice(product.price)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.stockText}>
                              {product.stockQuantity}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {outOfStock ? (
                              <span
                                style={{
                                  ...styles.badge,
                                  backgroundColor: "rgba(233,69,96,0.2)",
                                  color: "#e94560",
                                }}
                              >
                                Out of Stock
                              </span>
                            ) : lowStock ? (
                              <span
                                style={{
                                  ...styles.badge,
                                  backgroundColor: "rgba(243,156,18,0.2)",
                                  color: "#f39c12",
                                }}
                              >
                                Low Stock
                              </span>
                            ) : (
                              <span
                                style={{
                                  ...styles.badge,
                                  backgroundColor: "rgba(39,174,96,0.2)",
                                  color: "#27ae60",
                                }}
                              >
                                In Stock
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionBtns}>
                              <button
                                style={styles.editBtn}
                                onClick={() => openEdit(product)}
                                disabled={isDeleting}
                              >
                                <Pencil size={13} />
                                Edit
                              </button>
                              <button
                                style={{
                                  ...styles.deleteBtn,
                                  ...(isDeleting ? styles.disabledBtn : {}),
                                }}
                                onClick={() => handleDelete(product)}
                                disabled={isDeleting}
                              >
                                <Trash2 size={13} />
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modalMode && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === "create" ? (
                  <>
                    <Plus size={18} />
                    Add New Product
                  </>
                ) : (
                  <>
                    <Pencil size={18} />
                    Edit Product
                  </>
                )}
              </h2>
              <button style={styles.closeBtn} onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            {/* Form error */}
            {formError && (
              <div style={styles.errorBox}>
                <AlertTriangle size={15} />
                {formError}
              </div>
            )}

            {/* Image preview */}
            {form.imageUrl ? (
              <div style={styles.imagePreview}>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={styles.previewImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/200x120?text=Invalid+URL";
                  }}
                />
              </div>
            ) : (
              <div style={styles.imagePlaceholder}>
                <Image size={32} color="#2a2a4a" />
                <span style={styles.imagePlaceholderText}>
                  Image preview will appear here
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form} noValidate>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="name">
                  Product Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  style={styles.input}
                  placeholder="e.g. Wireless Headphones"
                  value={form.name}
                  onChange={handleFormChange}
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  style={styles.textarea}
                  placeholder="Brief product description..."
                  value={form.description}
                  onChange={handleFormChange}
                  disabled={isSaving}
                  rows={3}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="price">
                    Price (IDR) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    style={styles.input}
                    placeholder="e.g. 850000"
                    value={form.price === 0 ? "" : form.price}
                    onChange={handleFormChange}
                    disabled={isSaving}
                    min={1}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="stockQuantity">
                    Stock Quantity *
                  </label>
                  <input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    style={styles.input}
                    placeholder="e.g. 20"
                    value={form.stockQuantity === 0 ? "" : form.stockQuantity}
                    onChange={handleFormChange}
                    disabled={isSaving}
                    min={0}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="imageUrl">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  style={styles.input}
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  disabled={isSaving}
                />
              </div>

              {form.price > 0 && (
                <p style={styles.pricePreview}>
                  Price preview:{" "}
                  <strong style={{ color: "#e94560" }}>
                    {formatPrice(form.price)}
                  </strong>
                </p>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.saveBtn,
                    ...(isSaving ? styles.disabledBtn : {}),
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span style={styles.loadingRow}>
                      <Loader2
                        size={15}
                        style={{ animation: "spin 0.7s linear infinite" }}
                      />
                      {modalMode === "create" ? "Creating..." : "Saving..."}
                    </span>
                  ) : modalMode === "create" ? (
                    "Create Product"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  createBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
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
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "11px 16px 11px 42px",
    borderRadius: 10,
    border: "1.5px solid #2a2a4a",
    backgroundColor: "#16213e",
    color: "#f0f0f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
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
    fontFamily: "inherit",
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
    minWidth: 750,
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
    transition: "background-color 0.15s",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #1a2547",
    verticalAlign: "middle",
  },
  idText: {
    fontSize: 12,
    color: "#666",
    fontWeight: 600,
  },
  productImg: {
    width: 52,
    height: 52,
    objectFit: "cover",
    borderRadius: 8,
    backgroundColor: "#1a1a2e",
    display: "block",
  },
  productInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    maxWidth: 280,
  },
  productName: {
    fontWeight: 700,
    color: "#f0f0f0",
    fontSize: 14,
  },
  productDesc: {
    fontSize: 12,
    color: "#777",
    lineHeight: 1.4,
  },
  priceText: {
    fontWeight: 700,
    color: "#e94560",
    whiteSpace: "nowrap",
  },
  stockText: {
    fontWeight: 600,
    color: "#ccc",
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  actionBtns: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: "rgba(52,152,219,0.15)",
    border: "1px solid rgba(52,152,219,0.4)",
    color: "#3498db",
    padding: "5px 12px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  deleteBtn: {
    backgroundColor: "rgba(233,69,96,0.12)",
    border: "1px solid rgba(233,69,96,0.35)",
    color: "#e94560",
    padding: "5px 12px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
    backdropFilter: "blur(4px)",
  },
  modalCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: "28px 32px",
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    border: "1px solid #2a2a4a",
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    padding: "4px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
    fontFamily: "inherit",
  },
  imagePreview: {
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #2a2a4a",
    backgroundColor: "#1a1a2e",
  },
  previewImg: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    display: "block",
  },
  imagePlaceholder: {
    height: 120,
    borderRadius: 10,
    border: "1.5px dashed #2a2a4a",
    backgroundColor: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#555",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#1a1a2e",
    border: "1.5px solid #2a2a4a",
    borderRadius: 8,
    padding: "10px 13px",
    fontSize: 14,
    color: "#f0f0f0",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  textarea: {
    backgroundColor: "#1a1a2e",
    border: "1.5px solid #2a2a4a",
    borderRadius: 8,
    padding: "10px 13px",
    fontSize: 14,
    color: "#f0f0f0",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 80,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  pricePreview: {
    margin: 0,
    fontSize: 13,
    color: "#888",
  },
  modalActions: {
    display: "flex",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "transparent",
    border: "1.5px solid #2a2a4a",
    color: "#aaa",
    padding: "11px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  saveBtn: {
    flex: 2,
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    padding: "11px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background-color 0.2s",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};
