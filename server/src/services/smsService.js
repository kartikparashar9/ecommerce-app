const sendPhoneOTP = async (
    phone,
    otp
) => {
    console.log(
        `OTP ${otp} sent to ${phone}`
    );
};

module.exports = {
    sendPhoneOTP
};