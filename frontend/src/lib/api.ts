import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem("accessToken", accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
    },
    getProfile: async () => {
        const response = await api.get("/auth/profile");
        return response.data;
    },
};

// Dashboard API
export const dashboardApi = {
    getOverview: async (countryId?: string) => {
        const params = countryId ? { countryId } : {};
        const response = await api.get("/dashboard", { params });
        return response.data;
    },
};

// Contacts API
export const contactsApi = {
    getAll: async (params?: { countryId?: string; search?: string }) => {
        const response = await api.get("/contacts", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/contacts/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/contacts", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/contacts/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/contacts/${id}`);
        return response.data;
    },
};

// Deals API
export const dealsApi = {
    getAll: async (params?: { stageId?: string; countryId?: string; status?: string }) => {
        const response = await api.get("/deals", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/deals/${id}`);
        return response.data;
    },
    getByStage: async (stageId: string) => {
        const response = await api.get(`/deals/stage/${stageId}`);
        return response.data;
    },
    getStatistics: async () => {
        const response = await api.get("/deals/statistics");
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/deals", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/deals/${id}`, data);
        return response.data;
    },
    moveToStage: async (id: string, stageId: string) => {
        const response = await api.patch(`/deals/${id}/stage`, { stageId });
        return response.data;
    },
    updateStatus: async (id: string, status: "WON" | "LOST") => {
        const response = await api.patch(`/deals/${id}/status`, { status });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/deals/${id}`);
        return response.data;
    },
};

// Pipeline Stages API
export const pipelineStagesApi = {
    getAll: async () => {
        const response = await api.get("/pipeline-stages");
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/pipeline-stages", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/pipeline-stages/${id}`, data);
        return response.data;
    },
    reorder: async (stages: { id: string; order: number }[]) => {
        const response = await api.patch("/pipeline-stages/reorder", { stages });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/pipeline-stages/${id}`);
        return response.data;
    },
};

// Activities API
export const activitiesApi = {
    getAll: async (params?: { dealId?: string; status?: string }) => {
        const response = await api.get("/activities", { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/activities/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/activities", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/activities/${id}`, data);
        return response.data;
    },
    complete: async (id: string) => {
        const response = await api.patch(`/activities/${id}/complete`);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/activities/${id}`);
        return response.data;
    },
};

// Notes API
export const notesApi = {
    getByDeal: async (dealId: string) => {
        const response = await api.get("/notes", { params: { dealId } });
        return response.data;
    },
    create: async (data: { content: string; dealId: string }) => {
        const response = await api.post("/notes", data);
        return response.data;
    },
    update: async (id: string, data: { content: string }) => {
        const response = await api.patch(`/notes/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/notes/${id}`);
        return response.data;
    },
};

// Countries API
export const countriesApi = {
    getAll: async () => {
        const response = await api.get("/countries");
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/countries", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/countries/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/countries/${id}`);
        return response.data;
    },
};

// Users API
export const usersApi = {
    getAll: async () => {
        const response = await api.get("/users");
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post("/users", data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.patch("/users/me/password", {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};
