import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCreditCard, FiSave, FiUser, FiBriefcase, FiMapPin } from "react-icons/fi";
import { updateSellerProfile } from "../sellerSlice";
import "./SellerSettings.css";

const SellerSettings = () => {
  const dispatch = useDispatch();
  const { profile, profileLoading, error, successMessage } = useSelector((state) => state.seller || {});
  const { user } = useSelector((state) => state.auth || {});
  const [tab, setTab] = useState("business");
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      businessName: profile.businessName || "",
      businessDescription: profile.businessDescription || "",
      businessEmail: profile.businessEmail || "",
      businessPhone: profile.businessPhone || "",
      businessType: profile.businessType || "individual",
      gstNumber: profile.gstNumber || "",
      panNumber: profile.panNumber || "",
      address: {
        addressLine1: profile.address?.addressLine1 || "",
        addressLine2: profile.address?.addressLine2 || "",
        city: profile.address?.city || "",
        state: profile.address?.state || "",
        country: profile.address?.country || "India",
        postalCode: profile.address?.postalCode || "",
      },
      bankDetails: {
        accountHolderName: profile.bankDetails?.accountHolderName || "",
        accountNumber: "",
        ifscCode: profile.bankDetails?.ifscCode || "",
        bankName: profile.bankDetails?.bankName || "",
      },
    });
  }, [profile]);

  const change = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [group, field] = name.split(".");
      setForm((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
    } else setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!form) return <div className="seller-settings-loading">Loading settings...</div>;

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      businessName: form.businessName.trim(),
      businessDescription: form.businessDescription.trim(),
      businessEmail: form.businessEmail.trim().toLowerCase(),
      businessPhone: form.businessPhone.trim(),
      businessType: form.businessType,
      gstNumber: form.gstNumber.trim().toUpperCase(),
      panNumber: form.panNumber.trim().toUpperCase(),
      address: form.address,
    };
    payload.bankDetails = {
      accountHolderName: form.bankDetails.accountHolderName.trim(),
      ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),
      bankName: form.bankDetails.bankName.trim(),
    };
    if (form.bankDetails.accountNumber.trim()) {
      payload.bankDetails.accountNumber = form.bankDetails.accountNumber.trim();
    }
    await dispatch(updateSellerProfile(payload));
  };

  return <div className="seller-settings-page">
    <div className="seller-settings-heading"><div><span>STORE MANAGEMENT</span><h2>Settings</h2><p>Manage your seller profile and account information.</p></div></div>
    <div className="seller-settings-tabs"><button className={tab === "business" ? "active" : ""} onClick={() => setTab("business")}><FiBriefcase /> Business Profile</button><button className={tab === "bank" ? "active" : ""} onClick={() => setTab("bank")}><FiCreditCard /> Bank Details</button><button className={tab === "account" ? "active" : ""} onClick={() => setTab("account")}><FiUser /> Account</button></div>

    {error && <div className="seller-settings-alert error">{error}</div>}
    {successMessage && <div className="seller-settings-alert success">{successMessage}</div>}

    {tab === "account" ? <div className="seller-settings-card"><div className="seller-settings-card-title"><FiUser /><div><h3>Account Information</h3><p>Your marketplace login information.</p></div></div><div className="seller-account-grid"><Info label="Name" value={user?.name}/><Info label="Email" value={user?.email}/><Info label="Role" value={user?.role}/><Info label="Email Verification" value={user?.isEmailVerified ? "Verified" : "Pending"}/></div></div> : <form className="seller-settings-card" onSubmit={submit}>
      {tab === "business" && <><div className="seller-settings-card-title"><FiBriefcase /><div><h3>Business Profile</h3><p>Keep your business and contact information up to date.</p></div></div><div className="seller-settings-grid two"><Field label="Business Name" name="businessName" value={form.businessName} onChange={change}/><Field label="Business Email" name="businessEmail" value={form.businessEmail} onChange={change} type="email"/><Field label="Business Phone" name="businessPhone" value={form.businessPhone} onChange={change}/><div className="seller-settings-field"><label>Business Type</label><select name="businessType" value={form.businessType} onChange={change}>{["individual","proprietorship","partnership","llp","private_limited","public_limited","other"].map((v)=><option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></div></div><div className="seller-settings-field full"><label>Business Description</label><textarea name="businessDescription" value={form.businessDescription} onChange={change} rows="4"/></div><div className="seller-settings-divider"><FiMapPin/><strong>Business Address</strong></div><div className="seller-settings-grid two"><Field label="Address Line 1" name="address.addressLine1" value={form.address.addressLine1} onChange={change}/><Field label="Address Line 2" name="address.addressLine2" value={form.address.addressLine2} onChange={change}/><Field label="City" name="address.city" value={form.address.city} onChange={change}/><Field label="State" name="address.state" value={form.address.state} onChange={change}/><Field label="Country" name="address.country" value={form.address.country} onChange={change}/><Field label="Postal Code" name="address.postalCode" value={form.address.postalCode} onChange={change}/></div><div className="seller-settings-divider"><FiBriefcase/><strong>Tax Information</strong></div><div className="seller-settings-grid two"><Field label="GST Number" name="gstNumber" value={form.gstNumber} onChange={change}/><Field label="PAN Number" name="panNumber" value={form.panNumber} onChange={change}/></div></>}
      {tab === "bank" && <><div className="seller-settings-card-title"><FiCreditCard /><div><h3>Bank Details</h3><p>Update settlement information when required.</p></div></div><div className="seller-settings-note">For security, the existing account number is not loaded into the form. Enter it only if you want to replace it.</div><div className="seller-settings-grid two"><Field label="Account Holder Name" name="bankDetails.accountHolderName" value={form.bankDetails.accountHolderName} onChange={change}/><Field label="Bank Name" name="bankDetails.bankName" value={form.bankDetails.bankName} onChange={change}/><Field label="New Account Number" name="bankDetails.accountNumber" value={form.bankDetails.accountNumber} onChange={change} type="password"/><Field label="IFSC Code" name="bankDetails.ifscCode" value={form.bankDetails.ifscCode} onChange={change}/></div></>}
      <div className="seller-settings-footer"><span>Changes are validated by the server before saving.</span><button className="seller-primary-btn" disabled={profileLoading}><FiSave/>{profileLoading ? "Saving..." : "Save Changes"}</button></div>
    </form>}
  </div>;
};

const Field = ({ label, ...props }) => <div className="seller-settings-field"><label>{label}</label><input {...props}/></div>;
const Info = ({ label, value }) => <div><span>{label}</span><strong>{value || "—"}</strong></div>;
export default SellerSettings;
