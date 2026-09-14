import React from "react";
import AvatarSelector from "./AvatarSelector";

const FormStepOne = ({
  formData,
  handleChange,
  handleAvatar,
  errors,
}) => {

  const handleAvatarSelection = (avatar) => {
    handleAvatar(avatar);

    let gender = "";

    if (avatar === "male") {
      gender = "male";
    } else if (avatar === "female") {
      gender = "female";
    }

    if (gender) {
      handleChange({
        target: {
          name: "gender",
          value: gender,
        },
      });
    }
  };

  return (
    <div className="signup-form fade-in">

      {/* Avatar */}

      <div className="form-group">

        <label>Select Avatar</label>

        <AvatarSelector
          selectedAvatar={formData.avatar}
          handleAvatar={handleAvatarSelection}
        />

        {errors.avatar && (
          <p className="error">
            {errors.avatar}
          </p>
        )}

        {/* Selected Gender */}

        {formData.gender && (
          <p className="selected-gender">
            Gender: <strong>{formData.gender}</strong>
          </p>
        )}

        {errors.gender && (
          <p className="error">
            {errors.gender}
          </p>
        )}

      </div>

      {/* Full Name */}

      <div className="form-group">

        <label htmlFor="fullName">
          Full Name
        </label>

        <input
          type="text"
          id="fullName"
          name="fullName"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleChange}
          autoComplete="name"
        />

        {errors.fullName && (
          <p className="error">
            {errors.fullName}
          </p>
        )}

      </div>

    </div>
  );
};

export default FormStepOne;
