"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { dealsApi, notesApi, activitiesApi, pipelineStagesApi } from "@/lib/api";
import { Deal, Note, Activity, PipelineStage } from "@/lib/types";
import { useAuthStore } from "@/lib/store";

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const dealId = params.id as string;

    const [activeTab, setActiveTab] = useState<"overview" | "activities" | "notes">("overview");
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const { data: deal, isLoading } = useQuery<Deal>({
        queryKey: ["deal", dealId],
        queryFn: () => dealsApi.getById(dealId),
    });

    const { data: notes = [] } = useQuery<Note[]>({
        queryKey: ["notes", dealId],
        queryFn: () => notesApi.getByDeal(dealId),
        enabled: !!dealId,
    });

    const { data: activities = [] } = useQuery<Activity[]>({
        queryKey: ["activities", dealId],
        queryFn: () => activitiesApi.getAll({ dealId }),
        enabled: !!dealId,
    });

    const { data: stages = [] } = useQuery<PipelineStage[]>({
        queryKey: ["pipeline-stages"],
        queryFn: pipelineStagesApi.getAll,
    });

    const { register: registerNote, handleSubmit: handleSubmitNote, reset: resetNote } = useForm<{ content: string }>();
    const {
        register: registerActivity,
        handleSubmit: handleSubmitActivity,
        reset: resetActivity,
    } = useForm<{
        type: string;
        title: string;
        description: string;
        dueDate: string;
    }>();

    const createNoteMutation = useMutation({
        mutationFn: (data: { content: string; dealId: string }) => notesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes", dealId] });
            toast.success("Note added successfully");
            setIsNoteModalOpen(false);
            resetNote();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add note");
        },
    });

    const createActivityMutation = useMutation({
        mutationFn: activitiesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", dealId] });
            toast.success("Activity created successfully");
            setIsActivityModalOpen(false);
            resetActivity();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create activity");
        },
    });

    const completeActivityMutation = useMutation({
        mutationFn: activitiesApi.complete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", dealId] });
            toast.success("Activity completed");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to complete activity");
        },
    });

    const moveStageMutation = useMutation({
        mutationFn: ({ id, stageId }: { id: string; stageId: string }) => dealsApi.moveToStage(id, stageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
            toast.success("Deal stage updated");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update stage");
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: "WON" | "LOST" }) => dealsApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
            toast.success("Deal status updated");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update status");
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-[48px] text-slate-400">error</span>
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">Deal not found</h3>
                    <button onClick={() => router.push("/deals")} className="btn-primary mt-4">
                        Back to Deals
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="w-full px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button onClick={() => router.push("/deals")} className="text-slate-500 hover:text-primary text-sm font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Deals
                    </button>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">{deal.name}</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight">{deal.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm pt-1">
                            {deal.contact?.name} • {deal.contact?.company || deal.contact?.email}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {deal.status === "OPEN" && (
                            <>
                                <button onClick={() => updateStatusMutation.mutate({ id: dealId, status: "WON" })} className="btn-primary bg-green-600 hover:bg-green-700">
                                    <span className="material-symbols-outlined text-[20px] mr-1">check_circle</span>
                                    Mark as Won
                                </button>
                                <button onClick={() => updateStatusMutation.mutate({ id: dealId, status: "LOST" })} className="btn-outline text-red-600 border-red-600 hover:bg-red-50">
                                    <span className="material-symbols-outlined text-[20px] mr-1">cancel</span>
                                    Mark as Lost
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Stage Progress */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pipeline Progress</h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2">
                                        {stages
                                            .sort((a, b) => a.order - b.order)
                                            .map((stage, index) => (
                                                <div key={stage.id} className="flex-1">
                                                    <button
                                                        onClick={() => deal.status === "OPEN" && moveStageMutation.mutate({ id: dealId, stageId: stage.id })}
                                                        disabled={deal.status !== "OPEN"}
                                                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                            deal.stageId === stage.id
                                                                ? "bg-primary text-white"
                                                                : stages.findIndex((s) => s.id === deal.stageId) > index
                                                                ? "bg-primary/20 text-primary"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        } ${deal.status !== "OPEN" ? "cursor-not-allowed" : ""}`}
                                                    >
                                                        {stage.name}
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="card p-0 overflow-hidden">
                                <div className="flex border-b border-slate-100 dark:border-slate-800">
                                    {(["overview", "activities", "notes"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6">
                                    {activeTab === "overview" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Value</p>
                                                    <p className="text-lg font-bold text-primary">
                                                        {deal.country?.currencySymbol || "€"}
                                                        {deal.value.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Expected Close Date</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "MMM d, yyyy") : "Not set"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Country</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {deal.country?.name} ({deal.country?.code})
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{format(new Date(deal.createdAt), "MMM d, yyyy")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "activities" && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-slate-900 dark:text-white">Activities</h4>
                                                <button onClick={() => setIsActivityModalOpen(true)} className="btn-primary text-sm py-2">
                                                    <span className="material-symbols-outlined text-[18px] mr-1">add</span>
                                                    Add Activity
                                                </button>
                                            </div>
                                            {activities.length === 0 ? (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No activities yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {activities.map((activity) => (
                                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <div
                                                                className={`p-2 rounded-lg ${
                                                                    activity.type === "CALL"
                                                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                                                        : activity.type === "EMAIL"
                                                                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                                                        : activity.type === "MEETING"
                                                                        ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                                                        : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                                                                }`}
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">
                                                                    {activity.type === "CALL" ? "call" : activity.type === "EMAIL" ? "mail" : activity.type === "MEETING" ? "event" : "task"}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                                                                {activity.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.description}</p>}
                                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Due: {format(new Date(activity.dueDate), "MMM d, yyyy")}</p>
                                                            </div>
                                                            {activity.status === "PENDING" && (
                                                                <button onClick={() => completeActivityMutation.mutate(activity.id)} className="text-green-600 hover:text-green-700">
                                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                                </button>
                                                            )}
                                                            {activity.status === "COMPLETED" && (
                                                                <span className="text-green-600">
                                                                    <span className="material-symbols-outlined text-[20px]">done</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "notes" && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-slate-900 dark:text-white">Notes</h4>
                                                <button onClick={() => setIsNoteModalOpen(true)} className="btn-primary text-sm py-2">
                                                    <span className="material-symbols-outlined text-[18px] mr-1">add</span>
                                                    Add Note
                                                </button>
                                            </div>
                                            {notes.length === 0 ? (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No notes yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {notes.map((note) => (
                                                        <div key={note.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{note.user?.name}</span>
                                                                <span>•</span>
                                                                <span>{format(new Date(note.createdAt), "MMM d, yyyy HH:mm")}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Deal Info */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Deal Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                                        <span
                                            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                                deal.status === "WON"
                                                    ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                                    : deal.status === "LOST"
                                                    ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                                                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                            }`}
                                        >
                                            {deal.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Stage</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{deal.stage?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Value</span>
                                        <span className="text-sm font-bold text-primary">
                                            {deal.country?.currencySymbol || "€"}
                                            {deal.value.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">{deal.contact?.name.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{deal.contact?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{deal.contact?.position}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                        {deal.contact?.email}
                                    </div>
                                    {deal.contact?.phone && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px]">call</span>
                                            {deal.contact.phone}
                                        </div>
                                    )}
                                    {deal.contact?.company && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px]">business</span>
                                            {deal.contact.company}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Modal */}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="card w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Note</h2>
                            <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitNote((data) => createNoteMutation.mutate({ ...data, dealId }))} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Note *</label>
                                <textarea {...registerNote("content", { required: "Note content is required" })} className="input mt-1 h-32 resize-none" placeholder="Add your note here..." />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1" disabled={createNoteMutation.isPending}>
                                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {isActivityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="card w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Activity</h2>
                            <button onClick={() => setIsActivityModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form
                            onSubmit={handleSubmitActivity((data) =>
                                createActivityMutation.mutate({
                                    ...data,
                                    dealId,
                                    assignedToId: user?.id,
                                })
                            )}
                            className="space-y-4"
                        >
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Type *</label>
                                <select {...registerActivity("type", { required: true })} className="input mt-1">
                                    <option value="CALL">Call</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="MEETING">Meeting</option>
                                    <option value="TASK">Task</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Title *</label>
                                <input {...registerActivity("title", { required: true })} className="input mt-1" placeholder="Follow-up call" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Description</label>
                                <textarea {...registerActivity("description")} className="input mt-1 h-20 resize-none" placeholder="Add details..." />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Due Date *</label>
                                <input {...registerActivity("dueDate", { required: true })} className="input mt-1" type="date" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1" disabled={createActivityMutation.isPending}>
                                    {createActivityMutation.isPending ? "Creating..." : "Create Activity"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
