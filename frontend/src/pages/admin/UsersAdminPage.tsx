import { useEffect, useState } from "react";
import { adminApi, type AdminUser } from "../../api/admin";
import { useAuth } from "../../contexts/AuthContext";
import { Users, User, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Role update state
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
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

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));

  const handleRoleChange = async (user: AdminUser, newRole: string) => {
    if (user.role === newRole) return;
    if (user.id === currentUser?.id) return;

    setUpdatingId(user.id);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await adminApi.updateUserRole(user.id, newRole);
      setUpdateSuccess(res.message);
      setTimeout(() => setUpdateSuccess(null), 3000);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update user role.";
      setUpdateError(msg);
      setTimeout(() => setUpdateError(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.filter((u) => u.role === "User").length;
  const totalAdmins = users.filter((u) => u.role === "Admin").length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}><Users size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />Users</h1>
            <p style={styles.pageSubtitle}>
              {users.length} account{users.length !== 1 ? "s" : ""} registered
            </p>
          </div>

          {/* Summary badges */}
          <div style={styles.summaryBadges}>
            <div style={styles.badge}>
              <span style={styles.badgeIcon}><User size={18} /></span>
              <span style={styles.badgeValue}>{totalUsers}</span>
              <span style={styles.badgeLabel}>Users</span>
            </div>
            <div style={{ ...styles.badge, ...styles.badgeAdmin }}>
              <span style={styles.badgeIcon}><Shield size={18} /></span>
              <span style={styles.badgeValue}>{totalAdmins}</span>
              <span style={styles.badgeLabel}>Admins</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by username, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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
            <p style={styles.mutedText}>Loading users...</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            {filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <User size={56} style={{ color: "#555" }} />
                <p style={styles.mutedText}>
                  {search ? "No users match your search." : "No users found."}
                </p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {[
                        "#",
                        "User",
                        "Role",
                        "Orders",
                        "Total Spent",
                        "Joined",
                        "Change Role",
                      ].map((h) => (
                        <th key={h} style={styles.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => {
                      const isUpdating = updatingId === u.id;
                      const isSelf = u.id === currentUser?.id;

                      return (
                        <tr
                          key={u.id}
                          style={{
                            ...styles.tr,
                            backgroundColor:
                              idx % 2 === 0 ? "#16213e" : "#1a2547",
                            opacity: isUpdating ? 0.6 : 1,
                          }}
                        >
                          {/* ID */}
                          <td style={styles.td}>
                            <span style={styles.idText}>#{u.id}</span>
                          </td>

                          {/* User info */}
                          <td style={styles.td}>
                            <div style={styles.userInfo}>
                              <div style={styles.avatar}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div style={styles.userDetails}>
                                <span style={styles.username}>
                                  {u.username}
                                  {isSelf && (
                                    <span style={styles.youBadge}>You</span>
                                  )}
                                </span>
                                <span style={styles.email}>{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.roleBadge,
                                ...(u.role === "Admin"
                                  ? styles.roleAdmin
                                  : styles.roleUser),
                              }}
                            >
                              {u.role === "Admin" ? <><Shield size={12} style={{ marginRight: 4 }} />Admin</> : <><User size={12} style={{ marginRight: 4 }} />User</>}
                            </span>
                          </td>

                          {/* Orders */}
                          <td style={styles.td}>
                            <span style={styles.ordersCount}>
                              {u.totalOrders}
                            </span>
                          </td>

                          {/* Total spent */}
                          <td style={styles.td}>
                            <span style={styles.totalSpent}>
                              {u.totalSpent > 0
                                ? formatPrice(u.totalSpent)
                                : "—"}
                            </span>
                          </td>

                          {/* Joined */}
                          <td style={styles.td}>
                            <span style={styles.dateText}>
                              {formatDate(u.createdAt)}
                            </span>
                          </td>

                          {/* Role changer */}
                          <td style={styles.td}>
                            {isSelf ? (
                              <span style={styles.cantChange}>
                                Cannot change own role
                              </span>
                            ) : isUpdating ? (
                              <div style={styles.updatingRow}>
                                <div style={styles.miniSpinner} />
                                <span style={styles.updatingText}>
                                  Updating...
                                </span>
                              </div>
                            ) : (
                              <div style={styles.roleToggle}>
                                <button
                                  style={{
                                    ...styles.roleBtn,
                                    ...(u.role === "User"
                                      ? styles.roleBtnActive
                                      : styles.roleBtnInactive),
                                  }}
                                  onClick={() => handleRoleChange(u, "User")}
                                  disabled={u.role === "User"}
                                >
                                  <User size={12} style={{ marginRight: 4 }} />User
                                </button>
                                <button
                                  style={{
                                    ...styles.roleBtn,
                                    ...(u.role === "Admin"
                                      ? styles.roleBtnAdminActive
                                      : styles.roleBtnInactive),
                                  }}
                                  onClick={() => handleRoleChange(u, "Admin")}
                                  disabled={u.role === "Admin"}
                                >
                                  <Shield size={12} style={{ marginRight: 4 }} />Admin
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Result count when searching */}
            {search && filtered.length > 0 && (
              <p style={styles.resultCount}>
                Showing {filtered.length} of {users.length} users
              </p>
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
    flexWrap: "wrap",
    gap: 16,
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
  summaryBadges: {
    display: "flex",
    gap: 12,
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52,152,219,0.15)",
    border: "1px solid rgba(52,152,219,0.3)",
    borderRadius: 10,
    padding: "10px 16px",
  },
  badgeAdmin: {
    backgroundColor: "rgba(155,89,182,0.15)",
    border: "1px solid rgba(155,89,182,0.3)",
  },
  badgeIcon: {
    fontSize: 18,
  },
  badgeValue: {
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
  },
  badgeLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
  },
  searchInput: {
    width: "100%",
    padding: "11px 16px",
    borderRadius: 10,
    border: "1.5px solid #2a2a4a",
    backgroundColor: "#16213e",
    color: "#f0f0f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
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
    minWidth: 900,
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
    padding: "13px 16px",
    borderBottom: "1px solid #1a2547",
    verticalAlign: "middle",
  },
  idText: {
    fontSize: 12,
    color: "#555",
    fontWeight: 600,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    backgroundColor: "#e94560",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    flexShrink: 0,
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },
  username: {
    fontSize: 14,
    fontWeight: 700,
    color: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  youBadge: {
    backgroundColor: "rgba(233,69,96,0.2)",
    color: "#e94560",
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 7px",
    borderRadius: 20,
    letterSpacing: 0.3,
    flexShrink: 0,
  },
  email: {
    fontSize: 12,
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 200,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  roleAdmin: {
    backgroundColor: "rgba(155,89,182,0.2)",
    color: "#9b59b6",
  },
  roleUser: {
    backgroundColor: "rgba(52,152,219,0.2)",
    color: "#3498db",
  },
  ordersCount: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ccc",
  },
  totalSpent: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e94560",
    whiteSpace: "nowrap",
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    whiteSpace: "nowrap",
  },
  cantChange: {
    fontSize: 12,
    color: "#444",
    fontStyle: "italic",
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
  roleToggle: {
    display: "flex",
    gap: 6,
  },
  roleBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "1.5px solid",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  roleBtnActive: {
    backgroundColor: "rgba(52,152,219,0.2)",
    borderColor: "#3498db",
    color: "#3498db",
    cursor: "default",
  },
  roleBtnAdminActive: {
    backgroundColor: "rgba(155,89,182,0.2)",
    borderColor: "#9b59b6",
    color: "#9b59b6",
    cursor: "default",
  },
  roleBtnInactive: {
    backgroundColor: "transparent",
    borderColor: "#2a2a4a",
    color: "#888",
  },
  resultCount: {
    margin: 0,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
};
