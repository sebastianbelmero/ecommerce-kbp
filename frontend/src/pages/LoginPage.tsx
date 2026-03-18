import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Lock, AlertTriangle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Lock size={28} color="#e94560" />
          </div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Sign in to your KBP Store account</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(isLoading ? styles.submitBtnDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={styles.loadingRow}>
                <Loader2
                  size={16}
                  style={{ animation: "spin 0.7s linear infinite" }}
                />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.footerLink}>
            Register here
          </Link>
        </p>

        <p style={styles.footer}>
          <Link to="/" style={styles.footerLink}>
            Continue browsing as guest
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f3460",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    backgroundColor: "rgba(233,69,96,0.12)",
    border: "1.5px solid rgba(233,69,96,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "#888",
  },
  errorBox: {
    backgroundColor: "rgba(233, 69, 96, 0.15)",
    border: "1px solid #e94560",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#e94560",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ccc",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#1a1a2e",
    border: "1.5px solid #2a2a4a",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    color: "#f0f0f0",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: 4,
    width: "100%",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    backgroundColor: "#555",
    cursor: "not-allowed",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  footer: {
    textAlign: "center",
    margin: 0,
    fontSize: 13,
    color: "#888",
  },
  footerLink: {
    color: "#e94560",
    fontWeight: 600,
    textDecoration: "none",
  },
};
