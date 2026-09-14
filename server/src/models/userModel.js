const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true
    },

    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true
    },

    pendingPhone: {
      type: String
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6
    },

    gender: {
      type: String,
      enum: ["male", "female"]
    },

    avatar: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: ["user", "admin", "seller"],
      required: true
    },

    googleId: {
      type: String
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    isPhoneVerified: {
      type: Boolean,
      default: false
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    resetPasswordToken: {
      type: String
    },

    resetPasswordExpire: {
      type: Date
    },

    lastLogin: {
      type: Date
    }

  },

  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;