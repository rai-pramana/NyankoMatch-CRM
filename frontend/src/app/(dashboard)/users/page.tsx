"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usersApi, countriesApi } from "@/lib/api";
import { User, Country } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserFormData {
    name: string;
    email: string;
    password?: string;
    role: "ADMIN" | "MANAGER";
    countryIds: string[];
}

export default function UsersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

    // Redirect if not admin
    useEffect(() => {
        if (currentUser && currentUser.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: usersApi.getAll,
        enabled: currentUser?.role === "ADMIN",
    });

    const { data: countries = [] } = useQuery<Country[]>({
        queryKey: ["countries"],
        queryFn: countriesApi.getAll,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormData>();

    const createMutation = useMutation({
        mutationFn: usersApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User created successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create user");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update user");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: usersApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete user");
        },
    });

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setSelectedCountries(user.countries.map((c) => c.id));
            reset({
                name: user.name,
                email: user.email,
                role: user.role,
                countryIds: user.countries.map((c) => c.id),
            });
        } else {
            setEditingUser(null);
            setSelectedCountries([]);
            reset({
                name: "",
                email: "",
                password: "",
                role: "MANAGER",
                countryIds: [],
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setSelectedCountries([]);
        reset();
    };

    const toggleCountry = (countryId: string) => {
        setSelectedCountries((prev) => (prev.includes(countryId) ? prev.filter((id) => id !== countryId) : [...prev, countryId]));
    };

    const onSubmit = (data: UserFormData) => {
        const payload = {
            ...data,
            countryIds: selectedCountries,
        };

        if (editingUser) {
            // Remove password if not provided
            if (!payload.password) {
                delete payload.password;
            }
            updateMutation.mutate({ id: editingUser.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) {
            toast.error("You cannot delete your own account");
            return;
        }
        if (confirm("Are you sure you want to delete this user?")) {
            deleteMutation.mutate(id);
        }
    };

    if (currentUser?.role !== "ADMIN") {
        return null;
    }

    return (
        <>
            {/* Header */}
            <header className="w-full px-4 sm:px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Home</span>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">Users</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-xl sm:text-2xl md:text-[28px] font-bold leading-tight">User Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm pt-1">Manage system users and their permissions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => openModal()} className="btn-primary gap-2 justify-center w-full sm:w-auto">
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                            <span>Add User</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-[1400px] mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="card text-center py-12">
                            <span className="material-symbols-outlined text-[48px] text-slate-400">group</span>
                            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No users yet</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Get started by adding your first user.</p>
                            <button onClick={() => openModal()} className="btn-primary mt-4">
                                Add User
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-3 md:hidden">
                                {users.map((user) => (
                                    <div key={user.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">{user.name.charAt(0).toUpperCase()}</div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openModal(user)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" disabled={user.id === currentUser?.id}>
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === "ADMIN" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}>
                                                {user.role}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned Countries:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {user.countries.slice(0, 4).map((country) => (
                                                    <span key={country.id} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                        {country.code}
                                                    </span>
                                                ))}
                                                {user.countries.length > 4 && <span className="text-xs text-slate-500">+{user.countries.length - 4}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="card p-0 overflow-hidden hidden md:block">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">User</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Role</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Countries</th>
                                                <th className="text-center py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">{user.name.charAt(0).toUpperCase()}</div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{user.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                user.role === "ADMIN" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                                            }`}
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.countries.slice(0, 3).map((country) => (
                                                                <span key={country.id} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                                    {country.code}
                                                                </span>
                                                            ))}
                                                            {user.countries.length > 3 && <span className="text-xs text-slate-500">+{user.countries.length - 3}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
                                                            {user.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button onClick={() => openModal(user)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" disabled={user.id === currentUser?.id}>
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="card w-full max-w-lg rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{editingUser ? "Edit User" : "Add User"}</h2>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Name *</label>
                                <input {...register("name", { required: "Name is required" })} className="input mt-1" placeholder="John Doe" />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Email *</label>
                                <input {...register("email", { required: "Email is required" })} className="input mt-1" type="email" placeholder="john@nyankomatch.com" />
                                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Password {editingUser ? "(leave blank to keep current)" : "*"}</label>
                                <input {...register("password", { required: !editingUser ? "Password is required" : false })} className="input mt-1" type="password" placeholder="••••••••" />
                                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Role *</label>
                                <select {...register("role", { required: "Role is required" })} className="input mt-1">
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Assigned Countries</label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">Select countries this user can access (Managers only see data from assigned countries)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    {countries.map((country) => (
                                        <label
                                            key={country.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                                selectedCountries.includes(country.id) ? "bg-primary/10 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                        >
                                            <input type="checkbox" checked={selectedCountries.includes(country.id)} onChange={() => toggleCountry(country.id)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                            <span className="text-sm">
                                                {country.name} ({country.code})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
