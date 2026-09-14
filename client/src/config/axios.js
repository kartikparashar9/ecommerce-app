import axios from "axios";

// ==========================================================
// AXIOS INSTANCE CONFIGURATION
// ==========================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true, // Enables cookie handling (Refresh Tokens)
});

// ==========================================================
// REQUEST INTERCEPTOR (Attaches Access Token)
// ==========================================================

instance.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================================
// RESPONSE INTERCEPTOR (Handles Auto Refresh & Logout)
// ==========================================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If 401 error and request hasn't been retried yet
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            // Do not retry refresh token endpoint itself to avoid infinite loop
            if (originalRequest.url.includes("/refresh")) {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return instance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call Token Refresh Endpoint
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const newToken = refreshResponse.data?.data?.accessToken;

                if (newToken) {
                    localStorage.setItem("token", newToken);
                    instance.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${newToken}`;
                    originalRequest.headers[
                        "Authorization"
                    ] = `Bearer ${newToken}`;

                    processQueue(null, newToken);
                    return instance(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                // Optional: window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default instance;