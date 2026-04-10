import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let getAuthToken: (() => Promise<string>) | null = null;
export const setAuthTokenGetter = (getter: () => Promise<string>) => {
  getAuthToken = getter;
};

// Adding authorization header to axios instance dynamically
axiosInstance.interceptors.request.use(async (config) => {
  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.warn("Failed to retrieve auth token silently", e);
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => (response.data.data ? response.data.data : response.data),
  (error) => {
    return Promise.reject({
      status: error.response?.status,
      data: error.response?.data || error.message,
    });
  },
);

export default axiosInstance;
