import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiCheckCircle,
  FiEdit3,
  FiMapPin,
  FiShield,
  FiUser,
  FiCreditCard,
  FiBriefcase,
} from "react-icons/fi";
import "./SellerProfile.css";

const pretty = (value) =>
  String(value || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SellerProfile = () => {
  const { profile } = useSelector((state) => state.seller || {});

  const profileAvatar = profile?.businessName?.trim()?.charAt(0)?.toUpperCase() || "S";

  if (!profile) return null;
  const status = profile.verificationStatus;

  return (
    <div className="seller-profile-page">
      <div className="seller-profile-heading">
        <div>
          <span>STORE IDENTITY</span>
          <h2>My Seller Profile</h2>
          <p>Review your business information and verification status.</p>
        </div>
        <Link to="/seller/settings" className="seller-outline-btn">
          <FiEdit3 /> Edit Profile
        </Link>
      </div>

      <div className="seller-profile-top">
        <div className="seller-profile-person">
          <div className="seller-profile-avatar">
            {profileAvatar}
          </div>
          <div>
            <h3>{profile.businessName}</h3>
            <p>{profile.businessEmail}</p>
            <small>{profile.businessPhone}</small>
          </div>
        </div>
        <div className={`seller-profile-status ${status}`}>
          <FiCheckCircle />
          <span>
            <strong>{pretty(status)}</strong>
            <small>Verification status</small>
          </span>
        </div>
      </div>

      <div className="seller-profile-status-grid">
        <div>
          <span>Verification</span>
          <strong>{pretty(status)}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{profile.isActive ? "Yes" : "No"}</strong>
        </div>
        <div>
          <span>Blocked</span>
          <strong>{profile.isBlocked ? "Yes" : "No"}</strong>
        </div>
        <div>
          <span>Business Type</span>
          <strong>{pretty(profile.businessType)}</strong>
        </div>
      </div>

      <div className="seller-profile-grid">
        <section className="seller-info-card">
          <header>
            <FiBriefcase />
            <div>
              <h3>Business Details</h3>
              <p>Registered store information.</p>
            </div>
          </header>
          <div className="seller-info-list">
            <Info label="Business Name" value={profile.businessName} />
            <Info label="Business Email" value={profile.businessEmail} />
            <Info label="Business Phone" value={profile.businessPhone} />
            <Info label="Business Type" value={pretty(profile.businessType)} />
            <Info label="GST Number" value={profile.gstNumber} />
            <Info label="PAN Number" value={profile.panNumber} />
            <Info label="Description" value={profile.businessDescription} />
          </div>
        </section>
        <section className="seller-info-card">
          <header>
            <FiMapPin />
            <div>
              <h3>Address Details</h3>
              <p>Your registered business address.</p>
            </div>
          </header>
          <div className="seller-info-list">
            <Info
              label="Address Line 1"
              value={profile.address?.addressLine1}
            />
            <Info
              label="Address Line 2"
              value={profile.address?.addressLine2}
            />
            <Info label="City" value={profile.address?.city} />
            <Info label="State" value={profile.address?.state} />
            <Info label="Country" value={profile.address?.country} />
            <Info label="Postal Code" value={profile.address?.postalCode} />
          </div>
        </section>
        <section className="seller-info-card">
          <header>
            <FiCreditCard />
            <div>
              <h3>Bank Details</h3>
              <p>Settlement account information.</p>
            </div>
          </header>
          <div className="seller-info-list">
            <Info
              label="Account Holder"
              value={profile.bankDetails?.accountHolderName}
            />
            <Info label="Bank Name" value={profile.bankDetails?.bankName} />
            <Info label="IFSC Code" value={profile.bankDetails?.ifscCode} />
            <Info label="Account Number" value="••••••••••" />
          </div>
          <div className="seller-private-note">
            <FiShield /> Account number is protected and not displayed.
          </div>
        </section>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="seller-info-row">
    <span>{label}</span>
    <strong>{value || "—"}</strong>
  </div>
);
export default SellerProfile;
