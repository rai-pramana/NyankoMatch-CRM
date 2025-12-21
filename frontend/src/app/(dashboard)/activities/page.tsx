"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { activitiesApi, dealsApi } from "@/lib/api";
import { Activity, Deal } from "@/lib/types";
import { useAuthStore } from "@/lib/store";

interface ActivityFormData {
    type: string;
    title: string;
    description?: string;
    dueDate: string;
    dealId?: string;
}

export default function ActivitiesPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "COMPLETED">("all");

    const { data: activities = [], isLoading } = useQuery<Activity[]>({
        queryKey: ["activities", statusFilter],
        queryFn: () => activitiesApi.getAll(statusFilter !== "all" ? { status: statusFilter } : undefined),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

    const { data: deals = [] } = useQuery<Deal[]>({
        queryKey: ["deals"],
        queryFn: () => dealsApi.getAll(),
        staleTime: 60 * 1000, // 1 minute
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ActivityFormData>();

    const createMutation = useMutation({
        mutationFn: activitiesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Activity created successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create activity");
        },
    });

    const completeMutation = useMutation({
        mutationFn: activitiesApi.complete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Activity completed");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to complete activity");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: activitiesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Activity deleted");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete activity");
        },
    });

    const openModal = () => {
        reset({
            type: "TASK",
            title: "",
            description: "",
            dueDate: "",
            dealId: "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: ActivityFormData) => {
        createMutation.mutate({
            ...data,
            assignedToId: user?.id,
            dealId: data.dealId || undefined,
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this activity?")) {
            deleteMutation.mutate(id);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "CALL":
                return "call";
            case "EMAIL":
                return "mail";
            case "MEETING":
                return "event";
            case "NOTE":
                return "note";
            default:
                return "task";
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "CALL":
                return "bg-blue-50 dark:bg-blue-900/20 text-blue-600";
            case "EMAIL":
                return "bg-purple-50 dark:bg-purple-900/20 text-purple-600";
            case "MEETING":
                return "bg-green-50 dark:bg-green-900/20 text-green-600";
            default:
                return "bg-orange-50 dark:bg-orange-900/20 text-orange-600";
        }
    };

    const pendingActivities = activities.filter((a) => a.status === "PENDING");
    const completedActivities = activities.filter((a) => a.status === "COMPLETED");

    return (
        <>
            {/* Header */}
            <header className="w-full px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Home</span>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">Activities</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight">Activities & To-Do</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm pt-1">Manage your tasks and activities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {(["all", "PENDING", "COMPLETED"] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        statusFilter === status ? "bg-primary text-white" : "bg-white dark:bg-[#151f2b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                        <button onClick={openModal} className="btn-primary gap-2">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Activity
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1200px] mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="card text-center py-12">
                            <span className="material-symbols-outlined text-[48px] text-slate-400">task_alt</span>
                            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No activities yet</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Get started by adding your first activity.</p>
                            <button onClick={openModal} className="btn-primary mt-4">
                                Add Activity
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pending Activities */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Pending
                                        <span className="ml-2 text-sm font-normal text-slate-500">({pendingActivities.length})</span>
                                    </h3>
                                </div>
                                <div className="p-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                                    {pendingActivities.length === 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No pending activities</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingActivities.map((activity) => (
                                                <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                                        <span className="material-symbols-outlined text-[20px]">{getActivityIcon(activity.type)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                                                        {activity.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{activity.description}</p>}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {activity.deal && <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{activity.deal.name}</span>}
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">Due: {format(new Date(activity.dueDate), "MMM d, yyyy")}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => completeMutation.mutate(activity.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                            title="Mark as completed"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(activity.id)}
                                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Completed Activities */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Completed
                                        <span className="ml-2 text-sm font-normal text-slate-500">({completedActivities.length})</span>
                                    </h3>
                                </div>
                                <div className="p-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                                    {completedActivities.length === 0 ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No completed activities</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {completedActivities.map((activity) => (
                                                <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                                                        <span className="material-symbols-outlined text-[20px]">done</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-through">{activity.title}</p>
                                                        {activity.deal && <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 mt-2 inline-block">{activity.deal.name}</span>}
                                                    </div>
                                                    <button onClick={() => handleDelete(activity.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="card w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Activity</h2>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Type *</label>
                                <select {...register("type", { required: "Type is required" })} className="input mt-1">
                                    <option value="TASK">Task</option>
                                    <option value="CALL">Call</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="MEETING">Meeting</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Title *</label>
                                <input {...register("title", { required: "Title is required" })} className="input mt-1" placeholder="Follow-up with client" />
                                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Description</label>
                                <textarea {...register("description")} className="input mt-1 h-24 resize-none" placeholder="Add details about this activity..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Due Date *</label>
                                    <input {...register("dueDate", { required: "Due date is required" })} className="input mt-1" type="date" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Related Deal</label>
                                    <select {...register("dealId")} className="input mt-1">
                                        <option value="">None</option>
                                        {deals.map((deal) => (
                                            <option key={deal.id} value={deal.id}>
                                                {deal.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Creating..." : "Create Activity"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
