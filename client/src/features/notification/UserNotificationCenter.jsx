import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  sendMessageToAdmin,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "./notificationApi";
import "./UserNotificationCenter.css";

const emptyForm = { title: "", message: "", channel: "both" };

const dataOf = (response) => response?.data?.data ?? {};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function UserNotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, read: 0 });
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 1,
    hasNextPage: false, hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, limit: 10 };
      if (filter !== "all") params.isRead = filter === "read";

      const [listResponse, countResponse] = await Promise.all([
        getMyNotifications(params),
        getUnreadNotificationCount(),
      ]);

      const data = dataOf(listResponse);
      const countData = dataOf(countResponse);
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setCounts(data.counts || { total: 0, unread: Number(countData.unreadCount || 0), read: 0 });
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const run = async (id, fn) => {
    try { setBusy(id); await fn(); await load(); }
    catch (err) { window.alert(err?.response?.data?.message || "Action failed"); }
    finally { setBusy(""); }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    try {
      setSending(true);
      const response = await sendMessageToAdmin({
        title: form.title.trim(),
        message: form.message.trim(),
        channel: form.channel,
        type: "general",
      });
      const result = dataOf(response);
      setShowContact(false);
      setForm(emptyForm);
      window.alert(result.emailSent === false && ["email", "both"].includes(form.channel)
        ? "Message saved for admin, but email delivery failed."
        : "Message sent to admin successfully.");
    } catch (err) {
      window.alert(err?.response?.data?.message || "Unable to contact admin");
    } finally { setSending(false); }
  };

  return (
    <section className="user-notification-center">
      <header className="unc-header">
        <div><h2><Bell size={21} /> Notifications</h2><p>Messages from the store team.</p></div>
        <button className="unc-primary" onClick={() => setShowContact(true)}><MessageSquare size={16} /> Contact Admin</button>
      </header>

      <div className="unc-stats">
        <button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setPage(1); }}><b>{counts.total}</b><span>Total</span></button>
        <button className={filter === "unread" ? "active" : ""} onClick={() => { setFilter("unread"); setPage(1); }}><b>{counts.unread}</b><span>Unread</span></button>
        <button className={filter === "read" ? "active" : ""} onClick={() => { setFilter("read"); setPage(1); }}><b>{counts.read}</b><span>Read</span></button>
      </div>

      <div className="unc-toolbar">
        <div><button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setPage(1); }}>All</button><button className={filter === "unread" ? "active" : ""} onClick={() => { setFilter("unread"); setPage(1); }}>Unread</button><button className={filter === "read" ? "active" : ""} onClick={() => { setFilter("read"); setPage(1); }}>Read</button></div>
        <div><button onClick={load}><RefreshCw size={15} /> Refresh</button><button disabled={!counts.unread || busy === "all-read"} onClick={() => run("all-read", markAllNotificationsAsRead)}><CheckCheck size={15} /> Mark all read</button><button disabled={!counts.read || busy === "delete-read"} onClick={() => run("delete-read", deleteAllReadNotifications)}><Trash2 size={15} /> Delete read</button></div>
      </div>

      {loading ? <div className="unc-state"><RefreshCw className="unc-spin" /> Loading...</div> : error ? <div className="unc-state unc-error">{error}</div> : notifications.length === 0 ? <div className="unc-empty"><Bell size={28} /><h3>No notifications</h3><p>Your website inbox is clear.</p></div> : (
        <div className="unc-list">
          {notifications.map((item) => (
            <article key={item._id} className={`unc-item ${item.isRead ? "read" : "unread"}`}>
              <div className="unc-icon"><Mail size={18} /></div>
              <div className="unc-body">
                <div className="unc-title"><strong>{item.title}</strong>{!item.isRead && <span>Unread</span>}</div>
                <p>{item.message}</p>
                <small>{item.direction === "user_to_admin" ? "Your message" : "From E-Commerce Team"} • {formatDate(item.createdAt)}</small>
              </div>
              <div className="unc-actions">
                {!item.isRead && <button disabled={busy === item._id} onClick={() => run(item._id, () => markNotificationAsRead(item._id))} title="Mark read"><Check size={16} /></button>}
                <button disabled={busy === item._id} onClick={() => run(item._id, () => deleteNotification(item._id))} title="Delete"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && pagination.total > 0 && <footer className="unc-pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div><button disabled={!pagination.hasPreviousPage} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17} /></button><button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}><ChevronRight size={17} /></button></div></footer>}

      {showContact && <div className="unc-backdrop"><form className="unc-modal" onSubmit={handleSend}>
        <div className="unc-modal-head"><div><MessageSquare size={18} /><div><h3>Contact Admin</h3><p>Send through website, email, or both.</p></div></div><button type="button" onClick={() => setShowContact(false)} disabled={sending}><X /></button></div>
        <label>Delivery method<select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}><option value="both">Website + Email</option><option value="in_app">Website notification only</option><option value="email">Email only</option></select></label>
        <label>Subject<input required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Message<textarea required maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><small>{form.message.length}/1000</small></label>
        <div className="unc-modal-actions"><button type="button" onClick={() => setShowContact(false)} disabled={sending}>Cancel</button><button type="submit" disabled={sending}><Send size={15} /> {sending ? "Sending..." : "Send to Admin"}</button></div>
      </form></div>}
    </section>
  );
}
