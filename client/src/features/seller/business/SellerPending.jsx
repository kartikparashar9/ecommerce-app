import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiClock, FiSettings } from "react-icons/fi";
import { fetchMySellerProfile } from "../sellerSlice";
import "./SellerPending.css";

const SellerPending = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.seller?.profile);

  useEffect(() => {
    if (profile?.verificationStatus !== "pending") return;

    const checkStatus = async () => {
      const result = await dispatch(fetchMySellerProfile({ force: true }));

      if (fetchMySellerProfile.fulfilled.match(result)) {
        const nextStatus = result.payload?.verificationStatus;
        if (nextStatus === "approved") {
          navigate("/seller/dashboard", { replace: true });
        }
      }
    };

    const intervalId = setInterval(checkStatus, 5000);
    return () => clearInterval(intervalId);
  }, [dispatch, navigate, profile?.verificationStatus]);

  return (
    <div className="seller-pending-page">
      <div className="seller-pending-card">
        <div className="seller-pending-icon"><FiClock /></div>
        <h2>Your seller application is under review</h2>
        <p>
          Thanks for completing your business registration. Marketplace administration will review your details before enabling seller operations.
        </p>
        <div className="seller-pending-steps">
          <div className="seller-pending-step"><strong><FiCheckCircle /> Details Submitted</strong><span>Completed</span></div>
          <div className="seller-pending-step"><strong><FiClock /> Admin Review</strong><span>In progress</span></div>
          <div className="seller-pending-step"><strong>Seller Access</strong><span>After approval</span></div>
        </div>
        <span className="seller-pending-status"><FiClock /> Pending Approval</span>
        <div style={{ marginTop: 22 }}>
          <Link to="/seller/settings" className="seller-outline-btn"><FiSettings /> View Settings</Link>
        </div>
      </div>
    </div>
  );
};

export default SellerPending;
