import { useEffect, useState } from "react";
import { productsApi, type Product } from "../api/products";
import ProductCard from "../components/ProductCard";
import { Search, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    productsApi
      .getAll()
      .then(setProducts)
      .catch(() => setError("Failed to load products. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to KBP Store</h1>
        <p style={styles.heroSub}>
          Discover the best tech products at amazing prices
        </p>
        <div style={styles.searchWrapper}>
          <Search size={16} color="#888" style={styles.searchIcon} />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {search ? `Results for "${search}"` : "All Products"}
          </h2>
          {!isLoading && (
            <span style={styles.count}>
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading products...</p>
          </div>
        )}

        {error && !isLoading && (
          <div style={styles.errorBox}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div style={styles.center}>
            <p style={styles.emptyText}>
              {search
                ? "No products match your search."
                : "No products available."}
            </p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div style={styles.grid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
  },
  hero: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    padding: "60px 24px",
    textAlign: "center",
    borderBottom: "1px solid #2a2a4a",
  },
  heroTitle: {
    margin: "0 0 12px",
    fontSize: 42,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: -1,
  },
  heroSub: {
    margin: "0 0 32px",
    fontSize: 16,
    color: "#aaa",
  },
  searchWrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    maxWidth: 480,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "12px 20px 12px 44px",
    borderRadius: 30,
    border: "2px solid #2a2a4a",
    backgroundColor: "#1a1a2e",
    color: "#f0f0f0",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "40px 24px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
  },
  count: {
    backgroundColor: "#e94560",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 24,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: 16,
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #2a2a4a",
    borderTop: "4px solid #e94560",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
    margin: 0,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    margin: 0,
  },
  errorBox: {
    backgroundColor: "rgba(233, 69, 96, 0.15)",
    border: "1px solid #e94560",
    borderRadius: 8,
    padding: "16px 20px",
    color: "#e94560",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};
