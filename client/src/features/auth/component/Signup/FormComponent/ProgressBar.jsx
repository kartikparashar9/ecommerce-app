import React from "react";
import { motion } from "framer-motion";
import "./ProgressBar.css";

const ProgressBar = ({ step }) => {
  const progress = ((step - 1) / 2) * 100;

  return (
    <div className="progress-wrapper">

      <div className="progress-track">

        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        />

      </div>

      <div className="progress-steps">

        <div className="progress-step">

          <motion.div
            className={`step-circle ${
              step >= 1 ? "active" : ""
            }`}
            whileHover={{ scale: 1.1 }}
          >
            1
          </motion.div>

          <span>Profile</span>

        </div>

        <div className="progress-step">

          <motion.div
            className={`step-circle ${
              step >= 2 ? "active" : ""
            }`}
            whileHover={{ scale: 1.1 }}
          >
            2
          </motion.div>

          <span>Account</span>

        </div>

        <div className="progress-step">

          <motion.div
            className={`step-circle ${
              step >= 3 ? "active" : ""
            }`}
            whileHover={{ scale: 1.1 }}
          >
            3
          </motion.div>

          <span>Finish</span>

        </div>

      </div>

    </div>
  );
};

export default ProgressBar;