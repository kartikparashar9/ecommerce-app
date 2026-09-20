import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import "./OrderSuccess.css";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <main className="order-success-page">
      <section className="order-success-card">
        <div className="order-success-icon">
          <CheckCircle2 size={34} />
        </div>
        <span>ORDER CONFIRMED</span>
        <h1>Thank you for your order!</h1>
        <p>
          Your order has been placed successfully. You can
          track its status from My Orders.
        </p>

        {orderId && (
          <div className="order-success-number">
            <small>Order ID</small>
            <strong>{orderId}</strong>
          </div>
        )}

        <div className="order-success-actions">
          <Link to="/orders">
            <Package size={16} /> View My Orders
          </Link>
          <Link to="/">Continue Shopping</Link>
        </div>
      </section>
    </main>
  );
}
