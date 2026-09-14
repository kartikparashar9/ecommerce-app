const loginAttempts = new Map();

const checkLoginAttempt = (key) => {
    const attempt = loginAttempts.get(key);

    if (!attempt) {
        return;
    }

    if (attempt.count >= 5) {
        const timePassed = Date.now() - attempt.time;

        if (timePassed < 15 * 60 * 1000) {
            const error = new Error(
                "Too many login attempts. Try again later"
            );

            error.statusCode = 429;

            throw error;
        }

        loginAttempts.delete(key);
    }
};

const increaseLoginAttempt = (key) => {
    const attempt = loginAttempts.get(key);

    if (!attempt) {
        loginAttempts.set(key, {
            count: 1,
            time: Date.now()
        });

        return;
    }

    attempt.count += 1;
};

const resetLoginAttempt = (key) => {
    loginAttempts.delete(key);
};

module.exports = {
    checkLoginAttempt,
    increaseLoginAttempt,
    resetLoginAttempt
};