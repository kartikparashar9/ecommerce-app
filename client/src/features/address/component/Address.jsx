import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";

import {
  createAddressApi,
  deleteAddressApi,
  getAddressesApi,
  setDefaultAddressApi,
  updateAddressApi,
} from "../AddressApi";

import { validateAddressPayload } from "../../utils/validation";

import "./Address.css";

const empty = {
  type: "",
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  isDefault: false,
};

const getList = (payload) => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.addresses)) return data.addresses;
  return [];
};

const getAddress = (payload) => {
  const data = payload?.data ?? payload;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data;
  }
  return null;
};

// =====================================================
// BUILD PAYLOAD (Sends both name & fullName for safety)
// =====================================================

const buildPayload = (form) => {
  const nameValue = String(form.name || "").trim();

  return {
    type: String(form.type || "")
      .trim()
      .toLowerCase(),
    name: nameValue,
    phone: String(form.phone || "").trim(),
    addressLine1: String(form.addressLine1 || "").trim(),
    addressLine2: String(form.addressLine2 || "").trim(),
    landmark: String(form.landmark || "").trim(),
    city: String(form.city || "").trim(),
    state: String(form.state || "").trim(),
    country: String(form.country || "India").trim(),
    postalCode: String(form.postalCode || "").trim(),
    isDefault: Boolean(form.isDefault),
  };
};

export default function Address() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...empty });

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [actionId, setActionId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAddressesApi();
      const addresses = getList(response).filter(Boolean);
      setItems(addresses);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load addresses",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ ...empty });
    setError("");
    setSuccess("");
  };

  // ===================================================
  // SUBMIT HANDLER WITH DETAILED CONSOLE LOGS
  // ===================================================

  const submit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const payload = buildPayload(form);

    // 1. Client-Side Validation
    try {
      if (typeof validateAddressPayload === "function") {
        validateAddressPayload(payload);
      }
    } catch (valErr) {
      setError(`Client Validation: ${valErr.message}`);
      return;
    }

    // 2. API Call
    try {
      setSaving(true);
      let response;

      if (editing) {
        response = await updateAddressApi(editing, payload);
        const updatedAddress = getAddress(response);

        if (updatedAddress?._id) {
          setItems((previous) =>
            previous.map((address) =>
              address._id === updatedAddress._id ? updatedAddress : address,
            ),
          );
        } else {
          await load();
        }

        setSuccess("Address updated successfully");
      } else {
        response = await createAddressApi(payload);
        await load();

        setSuccess("Address added successfully");
      }

      resetForm();
    } catch (err) {

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save address",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!id || actionId) return;
    if (!window.confirm("Delete this address?")) return;

    try {
      setActionId(id);
      setError("");
      await deleteAddressApi(id);
      setItems((current) => current.filter((item) => item._id !== id));
      if (editing === id) resetForm();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to delete address",
      );
    } finally {
      setActionId("");
    }
  };

  const makeDefault = async (id) => {
    if (!id || actionId) return;

    try {
      setActionId(id);
      setError("");
      const response = await setDefaultAddressApi(id);
      const updatedAddress = getAddress(response);
      const defaultId = updatedAddress?._id || id;

      setItems((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item._id === defaultId,
        })),
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to set default address",
      );
    } finally {
      setActionId("");
    }
  };

  const edit = (address) => {
    if (!address?._id) return;

    setEditing(address._id);
    setForm({
      type: address.type || "",
      name: address.name || address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: document.querySelector(".address-form")?.offsetTop
        ? document.querySelector(".address-form").offsetTop - 30
        : 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="address-page">
      <div className="address-header">
        <div>
          <span className="address-eyebrow">DELIVERY</span>
          <h1>My Addresses</h1>
          <p>Manage saved delivery addresses.</p>
        </div>

        <button type="button" onClick={resetForm}>
          <Plus size={17} />
          Add Address
        </button>
      </div>

      {error && (
        <div className="address-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="address-success" role="status">
          {success}
        </div>
      )}

      {loading ? (
        <div className="address-state">Loading addresses...</div>
      ) : items.length === 0 ? (
        <div className="address-state">
          <MapPin size={28} />
          <strong>No saved addresses</strong>
          <span>Add an address to make checkout faster.</span>
        </div>
      ) : (
        <div className="address-grid">
          {items.map((address) => (
            <article
              className={`address-card ${address.isDefault ? "default" : ""}`}
              key={address._id}
            >
              <div className="address-card-top">
                <span>
                  <MapPin size={18} />
                  {address.isDefault
                    ? "Default"
                    : address.type
                      ? address.type.charAt(0).toUpperCase() +
                        address.type.slice(1)
                      : "Saved address"}
                </span>
                {address.isDefault && <Star size={16} fill="currentColor" />}
              </div>

              <strong>{address.name || address.fullName || "Address"}</strong>

              <p>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ""}
              </p>

              {address.landmark && <p>Landmark: {address.landmark}</p>}

              <p>
                {address.city}, {address.state} - {address.postalCode}
              </p>

              <p>{address.country || "India"}</p>

              {address.phone && <small>{address.phone}</small>}

              <div className="address-actions">
                <button
                  type="button"
                  disabled={Boolean(actionId)}
                  onClick={() => edit(address)}
                >
                  <Pencil size={15} />
                  Edit
                </button>

                {!address.isDefault && (
                  <button
                    type="button"
                    disabled={actionId === address._id}
                    onClick={() => makeDefault(address._id)}
                  >
                    <Star size={15} />
                    Default
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionId === address._id}
                  onClick={() => remove(address._id)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <form className="address-form" onSubmit={submit} noValidate>
        <div className="address-form-title">
          <div>
            <span className="address-eyebrow">ADDRESS DETAILS</span>
            <h2>{editing ? "Edit address" : "Add address"}</h2>
          </div>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              aria-label="Cancel editing"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="address-form-grid">
          <label>
            Address type *
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={saving}
              required
            >
              <option value="" disabled>
                -- Select Address Type --
              </option>
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div className="address-field">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              maxLength={100}
              autoComplete="name"
              disabled={saving}
              required
            />
          </div>

          <label>
            Phone *
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              maxLength={10}
              inputMode="numeric"
              autoComplete="tel"
              disabled={saving}
              placeholder="10-digit mobile number"
            />
          </label>

          <label>
            Address line 1 *
            <input
              name="addressLine1"
              type="text"
              value={form.addressLine1}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={200}
              autoComplete="street-address"
              disabled={saving}
              placeholder="House no., street, area"
            />
          </label>

          <label>
            Address line 2
            <input
              name="addressLine2"
              type="text"
              value={form.addressLine2}
              onChange={handleChange}
              maxLength={200}
              autoComplete="address-line2"
              disabled={saving}
              placeholder="Apartment, floor, etc."
            />
          </label>

          <label>
            Landmark
            <input
              name="landmark"
              type="text"
              value={form.landmark}
              onChange={handleChange}
              maxLength={150}
              disabled={saving}
              placeholder="Nearby landmark"
            />
          </label>

          <label>
            City *
            <input
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              required
              maxLength={100}
              autoComplete="address-level2"
              disabled={saving}
              placeholder="City"
            />
          </label>

          <label>
            State *
            <input
              name="state"
              type="text"
              value={form.state}
              onChange={handleChange}
              required
              maxLength={100}
              autoComplete="address-level1"
              disabled={saving}
              placeholder="State"
            />
          </label>

          <label>
            Country *
            <input
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              required
              maxLength={100}
              autoComplete="country-name"
              disabled={saving}
            />
          </label>

          <label>
            Postal code *
            <input
              name="postalCode"
              type="text"
              value={form.postalCode}
              onChange={handleChange}
              required
              maxLength={6}
              inputMode="numeric"
              autoComplete="postal-code"
              disabled={saving}
              placeholder="6-digit PIN code"
            />
          </label>
        </div>

        <label className="address-default-checkbox">
          <input
            name="isDefault"
            type="checkbox"
            checked={form.isDefault}
            onChange={handleChange}
            disabled={saving}
          />
          <span>Set as default address</span>
        </label>

        <button type="submit" disabled={saving} className="address-save-button">
          {saving ? "Saving..." : editing ? "Update Address" : "Save Address"}
        </button>
      </form>
    </section>
  );
}
