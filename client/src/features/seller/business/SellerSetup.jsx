import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
  FiMapPin,
  FiMail,
} from "react-icons/fi";
import { createSellerProfile } from "../sellerSlice";
import "./SellerSetup.css";

const initialForm = {
  businessName: "",
  businessDescription: "",
  businessEmail: "",
  businessPhone: "",
  businessType: "individual",
  gstNumber: "",
  panNumber: "",
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  },
  bankDetails: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  },
};

/*
 * IMPORTANT:
 * This component is OUTSIDE SellerSetup.
 *
 * Do NOT move it inside SellerSetup,
 * otherwise the input can lose focus on every keystroke.
 */
const SellerField = ({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  form,
  errors,
  onChange,
}) => {
  const group = name.includes(".") ? name.split(".")[0] : null;
  const field = name.includes(".") ? name.split(".")[1] : name;

  const value = group ? form[group][field] : form[name];

  return (
    <div className="seller-form-field">
      <label>
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {errors[field] && <small>{errors[field]}</small>}
    </div>
  );
};

const SellerSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { profileLoading, error } = useSelector((state) => state.seller || {});

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const change = (event) => {
    const { name, value } = event.target;

    if (name.includes(".")) {
      const [group, field] = name.split(".");

      setForm((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    /*
     * Remove the error for the field while the user is typing.
     */
    setErrors((prev) => {
      const next = { ...prev };

      const errorKey = name.includes(".") ? name.split(".")[1] : name;

      delete next[errorKey];

      return next;
    });
  };

  const validate = () => {
    const next = {};

    if (!form.businessName.trim()) {
      next.businessName = "Business name is required.";
    }

    if (!form.businessEmail.trim()) {
      next.businessEmail = "Business email is required.";
    }

    if (!/^[6-9]\d{9}$/.test(form.businessPhone.trim())) {
      next.businessPhone = "Enter a valid 10-digit mobile number.";
    }

    if (!form.address.addressLine1.trim()) {
      next.addressLine1 = "Address is required.";
    }

    if (!form.address.city.trim()) {
      next.city = "City is required.";
    }

    if (!form.address.state.trim()) {
      next.state = "State is required.";
    }

    if (!/^[1-9][0-9]{5}$/.test(form.address.postalCode.trim())) {
      next.postalCode = "Enter a valid 6-digit postal code.";
    }

    if (!form.bankDetails.accountHolderName.trim()) {
      next.accountHolderName = "Account holder name is required.";
    }

    if (!form.bankDetails.accountNumber.trim()) {
      next.accountNumber = "Account number is required.";
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.bankDetails.ifscCode.trim())) {
      next.ifscCode = "Enter a valid IFSC code.";
    }

    if (!form.bankDetails.bankName.trim()) {
      next.bankName = "Bank name is required.";
    }

    if (
      form.panNumber.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.panNumber.trim())
    ) {
      next.panNumber = "Invalid PAN format.";
    }

    if (
      form.gstNumber.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(
        form.gstNumber.trim(),
      )
    ) {
      next.gstNumber = "Invalid GST format.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      businessName: form.businessName.trim(),

      businessDescription: form.businessDescription.trim(),

      businessEmail: form.businessEmail.trim().toLowerCase(),

      businessPhone: form.businessPhone.trim(),

      businessType: form.businessType,

      address: {
        ...form.address,
        addressLine1: form.address.addressLine1.trim(),
        addressLine2: form.address.addressLine2.trim(),
        city: form.address.city.trim(),
        state: form.address.state.trim(),
        country: form.address.country.trim(),
        postalCode: form.address.postalCode.trim(),
      },

      bankDetails: {
        ...form.bankDetails,
        accountHolderName: form.bankDetails.accountHolderName.trim(),

        accountNumber: form.bankDetails.accountNumber.trim(),

        ifscCode: form.bankDetails.ifscCode.trim().toUpperCase(),

        bankName: form.bankDetails.bankName.trim(),
      },
    };

    if (form.gstNumber.trim()) {
      payload.gstNumber = form.gstNumber.trim().toUpperCase();
    }

    if (form.panNumber.trim()) {
      payload.panNumber = form.panNumber.trim().toUpperCase();
    }

    const result = await dispatch(createSellerProfile(payload));

    if (createSellerProfile.fulfilled.match(result)) {
      navigate("/seller/pending", {
        replace: true,
      });
    }
  };

  return (
    <div className="seller-setup-page">
      {/* HERO */}
      <div className="seller-form-hero">
        <span>SELLER ONBOARDING</span>

        <h2>Set up your store</h2>

        <p>
          Complete your business information. Your application will be reviewed
          by marketplace administration.
        </p>
      </div>

      {/* ERROR */}
      {error && <div className="seller-form-alert">{error}</div>}

      {/* FORM */}
      <form className="seller-form-card" onSubmit={submit}>
        {/* ================= BUSINESS INFORMATION ================= */}
        <section>
          <div className="seller-form-section-title">
            <span>
              <FiBriefcase />
            </span>

            <div>
              <h3>Business information</h3>

              <p>Tell customers and our team about your business.</p>
            </div>
          </div>

          <div className="seller-form-grid two">
            <SellerField
              label="Business Name"
              name="businessName"
              placeholder="ABC Traders"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <div className="seller-form-field">
              <label>Business Type *</label>

              <select
                name="businessType"
                value={form.businessType}
                onChange={change}
              >
                {[
                  "individual",
                  "proprietorship",
                  "partnership",
                  "llp",
                  "private_limited",
                  "public_limited",
                  "other",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="seller-form-field full">
            <label>Business Description</label>

            <textarea
              name="businessDescription"
              value={form.businessDescription}
              onChange={change}
              placeholder="Describe your store, products and customer offering..."
              rows="4"
            />
          </div>
        </section>

        {/* ================= CONTACT INFORMATION ================= */}
        <section>
          <div className="seller-form-section-title">
            <span>
              <FiMail />
            </span>

            <div>
              <h3>Contact information</h3>

              <p>Business contact details used for seller communication.</p>
            </div>
          </div>

          <div className="seller-form-grid two">
            <SellerField
              label="Business Email"
              name="businessEmail"
              type="email"
              placeholder="store@example.com"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="Business Phone"
              name="businessPhone"
              placeholder="9876543210"
              required
              form={form}
              errors={errors}
              onChange={change}
            />
          </div>
        </section>

        {/* ================= BUSINESS ADDRESS ================= */}
        <section>
          <div className="seller-form-section-title">
            <span>
              <FiMapPin />
            </span>

            <div>
              <h3>Business address</h3>

              <p>Where your business operates from.</p>
            </div>
          </div>

          <div className="seller-form-grid two">
            <SellerField
              label="Address Line 1"
              name="address.addressLine1"
              placeholder="123 Business Street"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="Address Line 2"
              name="address.addressLine2"
              placeholder="Suite / landmark"
              form={form}
              errors={errors}
              onChange={change}
            />
          </div>

          <div className="seller-form-grid three">
            <SellerField
              label="City"
              name="address.city"
              placeholder="Bhopal"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="State"
              name="address.state"
              placeholder="Madhya Pradesh"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="Postal Code"
              name="address.postalCode"
              placeholder="462001"
              required
              form={form}
              errors={errors}
              onChange={change}
            />
          </div>
        </section>

        {/* ================= TAX INFORMATION ================= */}
        <section>
          <div className="seller-form-section-title">
            <span>
              <FiFileText />
            </span>

            <div>
              <h3>Tax information</h3>

              <p>Optional identifiers for your business.</p>
            </div>
          </div>

          <div className="seller-form-grid two">
            <SellerField
              label="GST Number"
              name="gstNumber"
              placeholder="22AAAAA0000A1Z5"
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="PAN Number"
              name="panNumber"
              placeholder="ABCDE1234F"
              form={form}
              errors={errors}
              onChange={change}
            />
          </div>
        </section>

        {/* ================= BANK DETAILS ================= */}
        <section>
          <div className="seller-form-section-title">
            <span>
              <FiCreditCard />
            </span>

            <div>
              <h3>Bank details</h3>

              <p>Required for seller settlement and payouts.</p>
            </div>
          </div>

          <div className="seller-form-grid two">
            <SellerField
              label="Account Holder Name"
              name="bankDetails.accountHolderName"
              placeholder="John Doe"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="Bank Name"
              name="bankDetails.bankName"
              placeholder="State Bank of India"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="Account Number"
              name="bankDetails.accountNumber"
              type="password"
              placeholder="Enter account number"
              required
              form={form}
              errors={errors}
              onChange={change}
            />

            <SellerField
              label="IFSC Code"
              name="bankDetails.ifscCode"
              placeholder="SBIN0001234"
              required
              form={form}
              errors={errors}
              onChange={change}
            />
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <div className="seller-form-footer">
          <p>
            By submitting, you confirm the business information is accurate.
          </p>

          <button
            type="submit"
            className="seller-primary-btn"
            disabled={profileLoading}
          >
            {profileLoading ? (
              "Submitting..."
            ) : (
              <>
                Submit Application
                <FiArrowRight />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerSetup;
