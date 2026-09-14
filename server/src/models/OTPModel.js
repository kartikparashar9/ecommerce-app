const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        identifier: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: [
                "email",
                "phone"
            ],
            required: true
        },

        otp: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            enum: [
                "signup",
                "forgotPassword",
                "login"
            ],
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        verified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

otpSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

module.exports =
    mongoose.models.OTP ||
    mongoose.model(
        "OTP",
        otpSchema
    );