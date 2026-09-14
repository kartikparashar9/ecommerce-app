const otpAttempts = new Map();

const checkOTPAttempt = (key) => {
    const attempt = otpAttempts.get(key);

    if (!attempt) {
        return;
    }

    if (attempt.count >= 5) {
        const timePassed = Date.now() - attempt.time;

        if (timePassed < 10 * 60 * 1000) {
            const error = new Error(
                "Too many OTP attempts. Try again later"
            );

            error.statusCode = 429;

            throw error;
        }

        otpAttempts.delete(key);
    }
};

const increaseOTPAttempt = (key) => {
    const attempt = otpAttempts.get(key);

    if (!attempt) {
        otpAttempts.set(key, {
            count: 1,
            time: Date.now()
        });

        return;
    }

    attempt.count += 1;
};

const resetOTPAttempt = (key) => {
    otpAttempts.delete(key);
};

module.exports = {
    checkOTPAttempt,
    increaseOTPAttempt,
    resetOTPAttempt
};