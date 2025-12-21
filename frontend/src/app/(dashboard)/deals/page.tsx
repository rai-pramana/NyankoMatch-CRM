"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { dealsApi, pipelineStagesApi, contactsApi, countriesApi } from "@/lib/api";
import { Deal, PipelineStage, Contact, Country } from "@/lib/types";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DealFormData {
    name: string;
    value: number;
    expectedCloseDate?: string;
    contactId: string;
    countryId: string;
    stageId: string;
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: deal.id,
        data: { type: "deal", deal },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white dark:bg-[#1a2433] rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow relative">
            {/* Drag handle - visible on all devices */}
            <div {...attributes} {...listeners} className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing touch-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
            </div>
            <div onClick={onClick} className="cursor-pointer pr-6">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{deal.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deal.contact?.name}</p>
                <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-semibold text-primary">
                        {deal.country?.currencySymbol || "€"}
                        {deal.value.toLocaleString()}
                    </span>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            deal.status === "WON" ? "bg-green-50 dark:bg-green-900/20 text-green-600" : deal.status === "LOST" ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                        }`}
                    >
                        {deal.status}
                    </span>
                </div>
            </div>
        </div>
    );
}

function PipelineColumn({ stage, deals, onDealClick }: { stage: PipelineStage; deals: Deal[]; onDealClick: (deal: Deal) => void }) {
    const stageDeals = deals.filter((d) => d.stageId === stage.id && d.status === "OPEN");
    const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
        data: { type: "stage", stage },
    });

    return (
        <div className="flex-shrink-0 w-64 sm:w-72 flex flex-col bg-slate-50 dark:bg-[#151f2b] rounded-xl">
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{stage.name}</h3>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{stageDeals.length}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">€{totalValue.toLocaleString()}</p>
            </div>
            <div ref={setNodeRef} className={`p-2 flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-320px)] transition-colors ${isOver ? "bg-primary/10 ring-2 ring-primary ring-inset rounded-b-xl" : ""}`}>
                <SortableContext items={stageDeals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {stageDeals.map((deal) => (
                            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
                        ))}
                        {stageDeals.length === 0 && <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs sm:text-sm">Drop deals here</div>}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

export default function DealsPage() {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

    // Use both pointer and touch sensors for drag & drop support on all devices
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));

    const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
        queryKey: ["deals"],
        queryFn: () => dealsApi.getAll(),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

    const { data: stages = [] } = useQuery<PipelineStage[]>({
        queryKey: ["pipeline-stages"],
        queryFn: pipelineStagesApi.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ["contacts"],
        queryFn: () => contactsApi.getAll(),
        staleTime: 60 * 1000, // 1 minute
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
    } = useForm<DealFormData>();

    const createMutation = useMutation({
        mutationFn: dealsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deals"] });
            toast.success("Deal created successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create deal");
        },
    });

    const moveMutation = useMutation({
        mutationFn: ({ id, stageId }: { id: string; stageId: string }) => dealsApi.moveToStage(id, stageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deals"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to move deal");
        },
    });

    const openModal = () => {
        reset({
            name: "",
            value: 0,
            expectedCloseDate: "",
            contactId: contacts[0]?.id || "",
            countryId: countries[0]?.id || "",
            stageId: stages[0]?.id || "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: DealFormData) => {
        createMutation.mutate({
            ...data,
            value: Number(data.value),
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const deal = deals.find((d) => d.id === event.active.id);
        setActiveDeal(deal || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const dealId = active.id as string;
        const deal = deals.find((d) => d.id === dealId);
        if (!deal) return;

        // Find target stage
        const overStage = stages.find((s) => s.id === over.id);
        const overDeal = deals.find((d) => d.id === over.id);
        const targetStageId = overStage?.id || overDeal?.stageId;

        if (targetStageId && targetStageId !== deal.stageId) {
            moveMutation.mutate({ id: dealId, stageId: targetStageId });
        }
    };

    return (
        <>
            {/* Header */}
            <header className="w-full px-4 sm:px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Home</span>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">Deals</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-xl sm:text-2xl md:text-[28px] font-bold leading-tight">Deals Pipeline</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm pt-1">Track and manage your sales pipeline</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* View Toggle */}
                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button
                                onClick={() => setViewMode("pipeline")}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center ${
                                    viewMode === "pipeline" ? "bg-primary text-white" : "bg-white dark:bg-[#151f2b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px] sm:text-[18px] sm:mr-1">view_kanban</span>
                                <span className="hidden sm:inline">Pipeline</span>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center ${
                                    viewMode === "list" ? "bg-primary text-white" : "bg-white dark:bg-[#151f2b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px] sm:text-[18px] sm:mr-1">view_list</span>
                                <span className="hidden sm:inline">List</span>
                            </button>
                        </div>
                        <button onClick={openModal} className="btn-primary gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
                            <span className="hidden sm:inline">Add Deal</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6">
                {dealsLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : viewMode === "pipeline" ? (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto h-full pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {stages
                                .sort((a, b) => a.order - b.order)
                                .map((stage) => (
                                    <PipelineColumn key={stage.id} stage={stage} deals={deals} onDealClick={(deal) => setSelectedDeal(deal)} />
                                ))}
                        </div>
                        <DragOverlay>
                            {activeDeal ? (
                                <div className="bg-white dark:bg-[#1a2433] rounded-lg p-4 shadow-lg border border-primary">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">{activeDeal.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeDeal.contact?.name}</p>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <div className="h-full overflow-y-auto">
                        {/* Mobile Card View for List Mode */}
                        <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
                            {deals.map((deal) => (
                                <Link key={deal.id} href={`/deals/${deal.id}`} className="card hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-medium text-primary truncate">{deal.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{deal.contact?.name}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
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
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{deal.stage?.name}</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {deal.country?.currencySymbol || "€"}
                                            {deal.value.toLocaleString()}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="card p-0 overflow-hidden max-w-[1400px] mx-auto hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Deal Name</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Contact</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Stage</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Value</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deals.map((deal) => (
                                            <tr key={deal.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <Link href={`/deals/${deal.id}`} className="text-sm font-medium text-primary hover:underline">
                                                        {deal.name}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{deal.contact?.name}</td>
                                                <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{deal.stage?.name}</td>
                                                <td className="py-3 px-4 text-right text-sm font-medium text-slate-900 dark:text-white">
                                                    {deal.country?.currencySymbol || "€"}
                                                    {deal.value.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${
                                                            deal.status === "WON"
                                                                ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                                                : deal.status === "LOST"
                                                                ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                                                                : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                                        }`}
                                                    >
                                                        {deal.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link href={`/deals/${deal.id}`} className="text-slate-500 hover:text-primary transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Deal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="card w-full max-w-lg rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Create New Deal</h2>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Deal Name *</label>
                                <input {...register("name", { required: "Name is required" })} className="input mt-1" placeholder="Enterprise License" />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Value (€) *</label>
                                    <input {...register("value", { required: "Value is required", min: 0 })} className="input mt-1" type="number" placeholder="50000" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Expected Close Date</label>
                                    <input {...register("expectedCloseDate")} className="input mt-1" type="date" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Contact *</label>
                                <select {...register("contactId", { required: "Contact is required" })} className="input mt-1">
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.name} ({contact.company || contact.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Country *</label>
                                    <select {...register("countryId", { required: "Country is required" })} className="input mt-1">
                                        {countries.map((country) => (
                                            <option key={country.id} value={country.id}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Stage *</label>
                                    <select {...register("stageId", { required: "Stage is required" })} className="input mt-1">
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Creating..." : "Create Deal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deal Detail Modal */}
            {selectedDeal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setSelectedDeal(null)}>
                    <div className="card w-full max-w-lg rounded-t-2xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate pr-4">{selectedDeal.name}</h2>
                            <button onClick={() => setSelectedDeal(null)} className="text-slate-500 hover:text-slate-700 flex-shrink-0">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Contact</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedDeal.contact?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Stage</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedDeal.stage?.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Value</span>
                                <span className="text-sm font-bold text-primary">
                                    {selectedDeal.country?.currencySymbol || "€"}
                                    {selectedDeal.value.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Status</span>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        selectedDeal.status === "WON"
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                            : selectedDeal.status === "LOST"
                                            ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                    }`}
                                >
                                    {selectedDeal.status}
                                </span>
                            </div>
                            <div className="pt-4">
                                <Link href={`/deals/${selectedDeal.id}`} className="btn-primary w-full">
                                    View Full Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
