import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  Send,
  X,
  Mail,
  Globe,
  Layers,
  RefreshCw,
  Inbox,
  CheckCheck,
  AlertCircle,
  UserRound,
  ChevronDown,
} from "lucide-react";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  createNotification,
} from "../AdminApi";

import "./AdminNotificationsContent.css";

const NOTIFICATION_TYPES = [
  "general",
  "order",
  "payment",
  "shipping",
  "seller",
  "product",
  "coupon",
  "review",
  "system",
];

const CHANNELS = [
  {
    value: "both",
    label: "Website + Email",
    description: "Send to user's notification inbox and email",
    icon: Layers,
  },
  {
    value: "in_app",
    label: "Website Only",
    description: "Send only to user's website notification inbox",
    icon: Globe,
  },
  {
    value: "email",
    label: "Email Only",
    description: "Send only to user's registered email",
    icon: Mail,
  },
];

const EMPTY_FORM = {
  recipientEmail: "",
  title: "",
  message: "",
  type: "general",
  channel: "both",
};

const getChannelLabel = (channel) => {
  if (channel === "email") return "Email";
  if (channel === "in_app") return "Website";
  return "Website + Email";
};

const getNotificationIconClass = (type) => {
  return NOTIFICATION_TYPES.includes(type) ? type : "general";
};

const AdminNotificationsContent = () => {
  const [list, setList] = useState([]);

  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    read: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const load = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const params = {
        page: 1,
        limit: 50,
      };

      if (activeFilter === "unread") {
        params.isRead = false;
      }

      if (activeFilter === "read") {
        params.isRead = true;
      }

      if (typeFilter !== "all") {
        params.type = typeFilter;
      }

      const [notificationResponse, countResponse] = await Promise.all([
        getMyNotifications(params),
        getUnreadNotificationCount(),
      ]);

      const notificationData = notificationResponse?.data?.data || {};

      const notifications = Array.isArray(notificationData)
        ? notificationData
        : Array.isArray(notificationData.notifications)
          ? notificationData.notifications
          : [];

      setList(notifications);

      const serverCounts = notificationData?.counts || {};

      const unreadFromResponse = Number(notificationData?.unreadCount) || 0;

      const unreadFromCountApi =
        Number(countResponse?.data?.data?.unreadCount) || 0;

      setCounts({
        total: Number(serverCounts.total) || notifications.length,

        unread:
          Number(serverCounts.unread) ||
          unreadFromResponse ||
          unreadFromCountApi,

        read:
          Number(serverCounts.read) ||
          Math.max(
            0,
            (Number(serverCounts.total) || notifications.length) -
              (Number(serverCounts.unread) ||
                unreadFromResponse ||
                unreadFromCountApi),
          ),
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeFilter, typeFilter]);

  // =====================================================
  // AUTO HIDE SUCCESS MESSAGE
  // =====================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // =====================================================
  // ACTION HELPER
  // =====================================================

  const act = async (fn) => {
    try {
      setError("");
      await fn();
      await load(false);
    } catch (e) {
      setError(
        e?.response?.data?.message || "Action failed. Please try again.",
      );
    }
  };

  // =====================================================
  // SEND ADMIN → USER
  // =====================================================

  const send = async (e) => {
    e.preventDefault();

    if (!form.recipientEmail.trim()) {
      setError("Please enter user's email address.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!form.message.trim()) {
      setError("Please enter a message.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const payload = {
        recipientEmail: form.recipientEmail.trim().toLowerCase(),

        title: form.title.trim(),

        message: form.message.trim(),

        type: form.type,

        channel: form.channel,
      };

      const response = await createNotification(payload);

      const responseData = response?.data?.data || {};

      setShowSend(false);
      setForm(EMPTY_FORM);

      const emailSent = responseData?.emailSent;

      if (form.channel === "both" || form.channel === "email") {
        if (emailSent === false) {
          setSuccessMessage(
            "Website notification sent, but email delivery failed.",
          );
        } else {
          setSuccessMessage("Notification sent successfully.");
        }
      } else {
        setSuccessMessage("Website notification sent successfully.");
      }

      await load(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to send notification.");
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (sending) return;

    setShowSend(false);
    setForm(EMPTY_FORM);
  };

  // =====================================================
  // FILTERED LOCAL LIST
  // =====================================================

  const visibleList = useMemo(() => {
    if (!Array.isArray(list)) return [];

    return list;
  }, [list]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-notifications-content">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-notifications-header">
        <div className="notifications-heading">
          <div className="notifications-title-icon">
            <Bell size={22} strokeWidth={2} />
          </div>

          <div>
            <h1>Notifications</h1>

            <p>Manage user communication and your notification inbox.</p>
          </div>
        </div>

        <div className="notifications-header-actions">
          <button
            type="button"
            className="notification-refresh-btn"
            onClick={() => load(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "notification-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="notification-read-all-btn"
            onClick={() => act(markAllNotificationsAsRead)}
            disabled={loading || refreshing || counts.unread === 0}
          >
            <CheckCheck size={15} />
            Mark all read
          </button>

          <button
            type="button"
            className="notification-send-btn"
            onClick={() => {
              setError("");
              setShowSend(true);
            }}
          >
            <Send size={15} />
            Send to User
          </button>
        </div>
      </header>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="notification-success">
          <div className="notification-success-icon">
            <Check size={16} />
          </div>

          <div>
            <strong>Success</strong>
            <span>{successMessage}</span>
          </div>

          <button type="button" onClick={() => setSuccessMessage("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="notification-error">
          <AlertCircle size={17} />

          <div>
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>

          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="notification-summary">
        <div className="notification-summary-card">
          <div className="notification-summary-icon">
            <Inbox size={18} />
          </div>

          <div>
            <strong>{counts.total}</strong>
            <span>Total Messages</span>
          </div>
        </div>

        <div className="notification-summary-card unread-summary">
          <div className="notification-summary-icon">
            <Bell size={18} />
          </div>

          <div>
            <strong>{counts.unread}</strong>
            <span>Unread</span>
          </div>
        </div>

        <div className="notification-summary-card">
          <div className="notification-summary-icon">
            <Check size={18} />
          </div>

          <div>
            <strong>{counts.read}</strong>
            <span>Read</span>
          </div>
        </div>
      </section>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <section className="notification-toolbar">
        <div className="notification-filter-group">
          <button
            type="button"
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={activeFilter === "unread" ? "active" : ""}
            onClick={() => setActiveFilter("unread")}
          >
            Unread
          </button>

          <button
            type="button"
            className={activeFilter === "read" ? "active" : ""}
            onClick={() => setActiveFilter("read")}
          >
            Read
          </button>
        </div>

        <label className="notification-type-filter">
          <span>Type</span>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>

              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            <ChevronDown size={14} />
          </div>
        </label>
      </section>

      {/* =================================================
          NOTIFICATION LIST
      ================================================= */}

      {loading ? (
        <div className="admin-notification-state">
          <div className="notification-loader" />

          <h3>Loading notifications</h3>

          <p>Please wait while we load your inbox.</p>
        </div>
      ) : visibleList.length === 0 ? (
        <div className="notification-empty">
          <div className="notification-empty-icon">
            <Bell size={25} />
          </div>

          <h3>No notifications found</h3>

          <p>Your notification inbox is empty for the selected filter.</p>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("all");
              setTypeFilter("all");
            }}
          >
            <RefreshCw size={14} />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="admin-notification-list">
          {visibleList.map((notification) => {
            const type = notification?.type || "general";

            return (
              <article
                className={`admin-notification-item ${
                  notification?.isRead ? "read" : "unread"
                }`}
                key={notification?._id}
              >
                <div
                  className={`notification-icon ${getNotificationIconClass(
                    type,
                  )}`}
                >
                  <Bell size={18} />
                </div>

                <div className="notification-body">
                  <div className="notification-body-top">
                    <div className="notification-title-wrap">
                      <strong>{notification?.title || "Notification"}</strong>

                      {!notification?.isRead && (
                        <span className="unread-dot">New</span>
                      )}
                    </div>

                    <span className="notification-type">{type}</span>
                  </div>

                  <p>{notification?.message || ""}</p>

                  <div className="notification-meta">
                    <span>
                      <Bell size={12} />

                      {notification?.createdAt
                        ? new Date(notification.createdAt).toLocaleString(
                            "en-IN",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )
                        : "Unknown date"}
                    </span>

                    {notification?.channel && (
                      <span>
                        {notification.channel === "email" ? (
                          <Mail size={12} />
                        ) : notification.channel === "in_app" ? (
                          <Globe size={12} />
                        ) : (
                          <Layers size={12} />
                        )}

                        {getChannelLabel(notification.channel)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification?.isRead && (
                    <button
                      type="button"
                      className="mark-read-action"
                      onClick={() =>
                        act(() => markNotificationAsRead(notification._id))
                      }
                      title="Mark as read"
                    >
                      <Check size={15} />
                      <span>Mark read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="delete-notification-action"
                    onClick={() =>
                      act(() => deleteNotification(notification._id))
                    }
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="notification-footer">
        <button
          type="button"
          className="delete-read-btn"
          onClick={() => act(deleteAllReadNotifications)}
          disabled={loading || counts.read === 0}
        >
          <Trash2 size={14} />
          Delete all read
        </button>
      </div>

      {/* =================================================
          SEND MODAL
      ================================================= */}

      {showSend && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <form className="admin-notification-modal" onSubmit={send}>
            {/* MODAL HEADER */}

            <div className="notification-modal-header">
              <div>
                <div className="notification-modal-icon">
                  <Send size={18} />
                </div>

                <div>
                  <h2>Send to User</h2>

                  <p>Send a website notification, email, or both.</p>
                </div>
              </div>

              <button
                type="button"
                className="notification-modal-close"
                onClick={closeModal}
                disabled={sending}
              >
                <X size={17} />
              </button>
            </div>

            {/* FORM */}

            <div className="notification-form">
              {/* RECIPIENT */}

              <label>
                <span>
                  User Email <b>*</b>
                </span>

                <div className="notification-input-with-icon">
                  <UserRound size={16} />

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter user's registered email"
                    value={form.recipientEmail}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recipientEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <small>
                  The notification will be sent to this user's account.
                </small>
              </label>

              {/* DELIVERY */}

              <div className="notification-channel-section">
                <div className="notification-field-heading">
                  <span>
                    Delivery Method <b>*</b>
                  </span>

                  <small>Choose where the user receives this message.</small>
                </div>

                <div className="notification-channel-grid">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;

                    const selected = form.channel === channel.value;

                    return (
                      <button
                        type="button"
                        key={channel.value}
                        className={`notification-channel-card ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() =>
                          setForm({
                            ...form,
                            channel: channel.value,
                          })
                        }
                      >
                        <div className="channel-card-icon">
                          <Icon size={17} />
                        </div>

                        <div>
                          <strong>{channel.label}</strong>

                          <span>{channel.description}</span>
                        </div>

                        <div
                          className={`channel-radio ${
                            selected ? "checked" : ""
                          }`}
                        >
                          {selected && <Check size={11} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TYPE */}

              <label>
                <span>
                  Notification Type <b>*</b>
                </span>

                <div className="notification-select-wrapper">
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={15} />
                </div>
              </label>

              {/* SUBJECT */}

              <label>
                <span>
                  Subject <b>*</b>
                </span>

                <input
                  required
                  maxLength={150}
                  placeholder="Example: Your order has been shipped"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                />

                <small>{form.title.length}/150</small>
              </label>

              {/* MESSAGE */}

              <label>
                <span>
                  Message <b>*</b>
                </span>

                <textarea
                  required
                  maxLength={1000}
                  placeholder="Write your message to the user..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      message: e.target.value,
                    })
                  }
                />

                <small>{form.message.length}/1000</small>
              </label>
            </div>

            {/* FOOTER */}

            <div className="notification-modal-footer">
              <button
                type="button"
                className="notification-cancel-btn"
                onClick={closeModal}
                disabled={sending}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="notification-submit-btn"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <RefreshCw size={15} className="notification-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsContent;
