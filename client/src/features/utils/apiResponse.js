export const unwrapApiResponse = (response) => {
  const body = response?.data ?? response;
  if (!body || typeof body !== "object") return body ?? null;

  if (body.data !== undefined && typeof body.data !== "string") return body.data;
  if (body.message !== undefined && typeof body.message === "object") return body.message;
  return body;
};

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
