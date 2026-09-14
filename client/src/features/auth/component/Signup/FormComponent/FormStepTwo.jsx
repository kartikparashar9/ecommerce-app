import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const FormStepTwo = ({ formData, handleChange, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = formData.email || "";
  const role = formData.role || "";
  const password = formData.password || "";
  const confirmPassword = formData.confirmPassword || "";

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="signup-form fade-in">
      <div className="form-group">
        <label htmlFor="email">Email Address</label>

        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleChange}
          autoComplete="email"
          aria-invalid={Boolean(errors?.email)}
        />

        {errors?.email && (
          <p className="error">{errors.email}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">Account Type</label>

        <select
          id="role"
          name="role"
          value={role}
          onChange={handleChange}
          aria-invalid={Boolean(errors?.role)}
        >
          <option value="">Select Account Type</option>
          <option value="user">User Account</option>
          <option value="seller">Seller Account</option>
        </select>

        {errors?.role && (
          <p className="error">{errors.role}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Create a strong password"
            value={password}
            onChange={handleChange}
            autoComplete="new-password"
            aria-invalid={Boolean(errors?.password)}
          />

          <button
            type="button"
            className="password-eye"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errors?.password && (
          <p className="error">{errors.password}</p>
        )}

        <div className="password-rules">
          <p
            className={
              passwordChecks.length ? "valid" : "invalid"
            }
          >
            <span className="tick">
              {passwordChecks.length ? "✓" : "○"}
            </span>
            <span>8+ characters</span>
          </p>

          <p
            className={
              passwordChecks.uppercase ? "valid" : "invalid"
            }
          >
            <span className="tick">
              {passwordChecks.uppercase ? "✓" : "○"}
            </span>
            <span>Uppercase letter</span>
          </p>

          <p
            className={
              passwordChecks.lowercase ? "valid" : "invalid"
            }
          >
            <span className="tick">
              {passwordChecks.lowercase ? "✓" : "○"}
            </span>
            <span>Lowercase letter</span>
          </p>

          <p
            className={
              passwordChecks.number ? "valid" : "invalid"
            }
          >
            <span className="tick">
              {passwordChecks.number ? "✓" : "○"}
            </span>
            <span>One number</span>
          </p>

          <p
            className={
              passwordChecks.special ? "valid" : "invalid"
            }
          >
            <span className="tick">
              {passwordChecks.special ? "✓" : "○"}
            </span>
            <span>Special character</span>
          </p>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">
          Confirm Password
        </label>

        <div className="password-wrapper">
          <input
            type={
              showConfirmPassword ? "text" : "password"
            }
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            aria-invalid={
              Boolean(errors?.confirmPassword) ||
              passwordsDoNotMatch
            }
          />

          <button
            type="button"
            className="password-eye"
            onClick={() =>
              setShowConfirmPassword((prev) => !prev)
            }
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
          >
            {showConfirmPassword ? (
              <FaEyeSlash />
            ) : (
              <FaEye />
            )}
          </button>
        </div>

        {errors?.confirmPassword && (
          <p className="error">
            {errors.confirmPassword}
          </p>
        )}

        {!errors?.confirmPassword &&
          passwordsDoNotMatch && (
            <p className="error">
              Passwords do not match
            </p>
          )}

        {passwordsMatch && (
          <p className="verified-message">
            ✓ Passwords match
          </p>
        )}
      </div>
    </div>
  );
};

export default FormStepTwo;