import React from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiClock, FiSettings } from "react-icons/fi";
import "./SellerPending.css";
const SellerPending=()=> <div className="seller-pending-page"><div className="seller-pending-card"><div className="seller-pending-icon"><FiClock/></div><h2>Your seller application is under review</h2><p>Thanks for completing your business registration. Marketplace administration will review your details before enabling seller operations.</p><div className="seller-pending-steps"><div className="seller-pending-step"><strong><FiCheckCircle/> Details Submitted</strong><span>Completed</span></div><div className="seller-pending-step"><strong><FiClock/> Admin Review</strong><span>In progress</span></div><div className="seller-pending-step"><strong>Seller Access</strong><span>After approval</span></div></div><span className="seller-pending-status"><FiClock/> Pending Approval</span><div style={{marginTop:22}}><Link to="/seller/settings" className="seller-outline-btn"><FiSettings/> View Settings</Link></div></div></div>;
export default SellerPending;
