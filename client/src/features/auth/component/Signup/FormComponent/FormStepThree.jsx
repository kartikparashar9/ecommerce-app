import React from "react";

const FormStepThree = ({
  formData,
  handleChange,
  errors,
}) => {
  return (
    <div className="signup-form fade-in">
      {/* Mobile Number */}

      <div className="form-group">
        <label htmlFor="mobile">Mobile Number</label>

        <input
          type="tel"
          id="mobile"
          name="mobile"
          placeholder="Enter your mobile number"
          value={formData.mobile || ""}
          onChange={handleChange}
          autoComplete="tel"
          maxLength={10}
        />

        {errors?.mobile && (
          <p className="error">{errors.mobile}</p>
        )}
      </div>
    </div>
  );
};

export default FormStepThree;