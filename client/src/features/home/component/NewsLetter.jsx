import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Mail,
} from "lucide-react";

const Newsletter = ({ onSubscribe }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("error");
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");

      if (onSubscribe) {
        await onSubscribe(trimmedEmail);
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error(
        "Newsletter subscription failed:",
        error
      );

      setStatus("error");
    }
  };

  return (
    <section className="newsletter-section">
      <motion.div
        className="newsletter-container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{ once: true }}
      >
        <div className="newsletter-icon">
          {status === "success" ? (
            <CheckCircle size={28} />
          ) : (
            <Mail size={28} />
          )}
        </div>

        <div className="newsletter-content">
          <span>Stay Updated</span>

          <h2>
            {status === "success"
              ? "You're Subscribed!"
              : "Subscribe to our Newsletter"}
          </h2>

          <p>
            {status === "success"
              ? "Thank you for subscribing. We'll keep you updated."
              : "Get the latest updates about new products, exclusive deals and upcoming sales."}
          </p>
        </div>

        {status !== "success" && (
          <form
            className="newsletter-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div
              className={`newsletter-input ${
                status === "error"
                  ? "input-error"
                  : ""
              }`}
            >
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);

                  if (status === "error") {
                    setStatus("idle");
                  }
                }}
                placeholder="Enter your email"
                aria-label="Email address"
                aria-invalid={status === "error"}
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "Subscribing..."
                : "Subscribe"}

              {status !== "loading" && (
                <ArrowRight size={17} />
              )}
            </button>
          </form>
        )}
      </motion.div>

      {status === "error" && (
        <p className="newsletter-error">
          Please enter a valid email address.
        </p>
      )}
    </section>
  );
};

export default Newsletter;