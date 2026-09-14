const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        gender: {
            type: String,
            required: true,
            enum: ["male", "female"],
        },

        avatar: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            required: true,
            enum: ["user", "seller"],
            required:true,
        },
    },
    {
        timestamps: true,
    }
);

const PendingUser =
    mongoose.models.PendingUser ||
    mongoose.model(
        "PendingUser",
        pendingUserSchema
    );

module.exports = PendingUser;