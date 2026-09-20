import React from "react";
import "./Footer.css";
import { motion } from "framer-motion";

import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaGithub,
} from "react-icons/fa";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* ================= LEFT ================= */}

        <motion.div
          className="footer-about"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="footer-logo">
            {/* <img src={logo} alt="ShopSphere Logo" /> */}

            <h2>
              Just<span>Buy</span>
            </h2>
          </div>

          <p>
            ShopSphere is your one-stop destination for fashion, electronics,
            beauty, home essentials, and much more. We deliver premium products
            with the best shopping experience.
          </p>

          <div className="social-icons">
            <motion.a href="#" whileHover={{ scale: 1.2, rotate: 8 }}>
              <FaFacebookF />
            </motion.a>

            <motion.a href="#" whileHover={{ scale: 1.2, rotate: -8 }}>
              <FaInstagram />
            </motion.a>

            <motion.a href="#" whileHover={{ scale: 1.2, rotate: 8 }}>
              <FaTwitter />
            </motion.a>

            <motion.a href="#" whileHover={{ scale: 1.2, rotate: -8 }}>
              <FaLinkedinIn />
            </motion.a>

            <motion.a href="#" whileHover={{ scale: 1.2, rotate: 8 }}>
              <FaGithub />
            </motion.a>
          </div>
        </motion.div>

        {/* ================= QUICK LINKS ================= */}

        <motion.div
          className="footer-column"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3>Quick Links</h3>

          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/">Shop</a>
            </li>
            <li>
              <a href="/">Offers</a>
            </li>
            <li>
              <a href="/">About Us</a>
            </li>
            <li>
              <a href="/">Contact</a>
            </li>
          </ul>
        </motion.div>

        {/* ================= CATEGORIES ================= */}

        <motion.div
          className="footer-column"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3>Categories</h3>

          <ul>
            <li>
              <a href="/fashion">Fashion</a>
            </li>
            <li>
              <a href="/accessories">Accessories</a>
            </li>
            <li>
              <a href="/beauty">Beauty</a>
            </li>
            <li>
              <a href="/electronics">Electronics</a>
            </li>
            <li>
              <a href="/">Home</a>
            </li>
          </ul>
        </motion.div>

        {/* ================= CONTACT ================= */}

        <motion.div
          className="footer-column"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3>Contact</h3>

          <ul>
            <li>Email: support@justbuy.com</li>
            <li>Phone: +91 98765 43210</li>
            <li>Address: Indore, Madhya Pradesh, India</li>
            <li>Mon - Sat : 9 AM - 8 PM</li>
          </ul>
        </motion.div>
      </div>

      {/* ================= COPYRIGHT ================= */}

      <motion.div
        className="footer-bottom"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        viewport={{ once: true }}
      >
        © {year} <strong>JustBuy</strong>. All Rights Reserved.
      </motion.div>
    </footer>
  );
};

export default Footer;
