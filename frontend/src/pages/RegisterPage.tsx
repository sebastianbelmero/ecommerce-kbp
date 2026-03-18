import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, AlertTriangle, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successBox}>
            <CheckCircle size={56} color="#27ae60" />
            <h2 style={styles.successTitle}>Registration Successful!</h2>
            <p style={styles.successText}>
              Your account has been created. Redirecting you to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <UserPlus size={28} color="#e94560" />
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join KBP Store and start shopping</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              style={styles.input}
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>

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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              style={{
                ...styles.input,
                ...(confirmPassword && password !== confirmPassword
                  ? styles.inputError
                  : {}),
              }}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPassword && password !== confirmPassword && (
              <span style={styles.fieldError}>Passwords do not match</span>
            )}
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
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.footerLink}>
            Sign in here
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
    maxWidth: 440,
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
    fontFamily: "inherit",
  },
  inputError: {
    borderColor: "#e94560",
  },
  fieldError: {
    fontSize: 12,
    color: "#e94560",
    marginTop: 2,
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
  successBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "20px 0",
    textAlign: "center",
  },
  successTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#27ae60",
  },
  successText: {
    margin: 0,
    fontSize: 14,
    color: "#aaa",
    lineHeight: 1.6,
  },
};
