import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MANAGER";
    countries: Array<{
        id: string;
        name: string;
        code: string;
        currency: string;
        currencySymbol: string;
    }>;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken) => {
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                set({ user, accessToken, refreshToken, isAuthenticated: true });
            },
            clearAuth: () => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

interface AppState {
    sidebarOpen: boolean;
    selectedCountryId: string | null;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSelectedCountryId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: true,
    selectedCountryId: null,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSelectedCountryId: (id) => set({ selectedCountryId: id }),
}));
