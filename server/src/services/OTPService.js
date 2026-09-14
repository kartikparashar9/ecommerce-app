const OTP = require("../models/OTPModel");

const generateOTP = () => {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
};

const createOTP = async (
    identifier,
    type,
    purpose
) => {
    const otp = generateOTP();

    await OTP.deleteMany({
        identifier,
        type,
        purpose
    });

    const otpData = await OTP.create({
        identifier,
        type,
        purpose,
        otp,
        expiresAt: new Date(
            Date.now() + 5 * 60 * 1000
        )
    });

    return otpData;
};

const verifyOTP = async (
    identifier,
    type,
    purpose,
    otp
) => {
    const otpData = await OTP.findOne({
        identifier,
        type,
        purpose,
        otp
    });

    if (!otpData) {
        throw new Error(
            "Invalid OTP"
        );
    }

    if (otpData.expiresAt < new Date()) {
        await OTP.deleteOne({
            _id: otpData._id
        });

        throw new Error(
            "OTP expired"
        );
    }

    otpData.verified = true;

    await otpData.save();

    return true;
};

module.exports = {
    createOTP,
    verifyOTP
};