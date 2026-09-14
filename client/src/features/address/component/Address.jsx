import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { createAddressApi, deleteAddressApi, getAddressesApi, setDefaultAddressApi, updateAddressApi } from "../AddressApi";
import "./Address.css";

const empty = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", country: "India", postalCode: "" };
const getList = (payload) => { const d = payload?.data ?? payload; return Array.isArray(d) ? d : d?.addresses || []; };

export default function Address() {
  const [items, setItems] = useState([]), [form, setForm] = useState(empty), [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const load = async () => { try { setLoading(true); setError(""); setItems(getList(await getAddressesApi())); } catch (e) { setError(e?.response?.data?.message || "Unable to load addresses"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const submit = async (e) => { e.preventDefault(); if (!/^\d{6}$/.test(form.postalCode.trim())) return setError("Enter a valid 6-digit postal code."); try { setSaving(true); setError(""); if (editing) await updateAddressApi(editing, form); else await createAddressApi(form); setEditing(null); setForm(empty); await load(); } catch (e) { setError(e?.response?.data?.message || "Unable to save address"); } finally { setSaving(false); } };
  const remove = async (id) => { if (!window.confirm("Delete this address?")) return; try { await deleteAddressApi(id); await load(); } catch (e) { setError(e?.response?.data?.message || "Unable to delete address"); } };
  const makeDefault = async (id) => { try { await setDefaultAddressApi(id); await load(); } catch (e) { setError(e?.response?.data?.message || "Unable to set default address"); } };
  const edit = (a) => { setEditing(a._id); setForm({ ...empty, ...a }); };
  return <section className="address-page">
    <div className="address-header"><div><span className="address-eyebrow">DELIVERY</span><h1>My Addresses</h1><p>Manage saved delivery addresses.</p></div><button type="button" onClick={() => { setEditing(null); setForm(empty); }}><Plus size={17}/> Add Address</button></div>
    {error && <div className="address-error" role="alert">{error}</div>}
    {loading ? <div className="address-state">Loading addresses...</div> : <div className="address-grid">{items.map((a) => <article className={`address-card ${a.isDefault ? "default" : ""}`} key={a._id}><div className="address-card-top"><span><MapPin size={18}/>{a.isDefault ? "Default" : "Saved address"}</span>{a.isDefault && <Star size={16} fill="currentColor"/>}</div><strong>{a.fullName || a.name}</strong><p>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}</p><p>{a.city}, {a.state} - {a.postalCode}</p><p>{a.country || "India"}</p><small>{a.phone || ""}</small><div className="address-actions"><button type="button" onClick={() => edit(a)}><Pencil size={15}/> Edit</button>{!a.isDefault && <button type="button" onClick={() => makeDefault(a._id)}><Star size={15}/> Default</button>}<button type="button" onClick={() => remove(a._id)}><Trash2 size={15}/> Delete</button></div></article>)}{!items.length && <div className="address-state">No saved addresses yet.</div>}</div>}
    <form className="address-form" onSubmit={submit}><div className="address-form-title"><h2>{editing ? "Edit address" : "Add address"}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} aria-label="Cancel editing"><X size={18}/></button>}</div><div className="address-form-grid">{[["fullName","Full name"],["phone","Phone"],["addressLine1","Address line 1"],["addressLine2","Address line 2"],["city","City"],["state","State"],["postalCode","Postal code"]].map(([key,label])=><label key={key}>{label}<input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} required={key!=="addressLine2"} maxLength={key==="postalCode"?6:120}/></label>)}</div><button disabled={saving} type="submit">{saving ? "Saving..." : editing ? "Update Address" : "Save Address"}</button></form>
  </section>;
}
