const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

export const getApiOrigin = () => {
  const raw = String(import.meta.env.VITE_API_URL || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    return trimTrailingSlash(url.origin);
  } catch {
    return "";
  }
};

export const resolveMediaUrl = (value) => {
  if (!value) return "";
  const candidate = typeof value === "object"
    ? value.url || value.secure_url || value.path || value.src || ""
    : value;
  if (!candidate || typeof candidate !== "string") return "";
  const url = candidate.trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  const origin = getApiOrigin();
  if (!origin) return url;
  return `${origin}/${url.replace(/^\/+/, "")}`;
};

export const getInitial = (name, fallback = "U") => {
  const value = String(name || "").trim();
  return (value.charAt(0) || fallback).toUpperCase();
};
