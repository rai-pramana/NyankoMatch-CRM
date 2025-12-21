"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { contactsApi, countriesApi } from "@/lib/api";
import { Contact, Country } from "@/lib/types";
import { useAppStore } from "@/lib/store";

interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    countryId: string;
}

export default function ContactsPage() {
    const queryClient = useQueryClient();
    const { selectedCountryId } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: contacts = [], isLoading } = useQuery<Contact[]>({
        queryKey: ["contacts", selectedCountryId, searchQuery],
        queryFn: () => contactsApi.getAll({ countryId: selectedCountryId || undefined, search: searchQuery || undefined }),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

    const { data: countries = [] } = useQuery<Country[]>({
        queryKey: ["countries"],
        queryFn: countriesApi.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormData>();

    const createMutation = useMutation({
        mutationFn: contactsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            toast.success("Contact created successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create contact");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ContactFormData }) => contactsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            toast.success("Contact updated successfully");
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update contact");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: contactsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
            toast.success("Contact deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete contact");
        },
    });

    const openModal = (contact?: Contact) => {
        if (contact) {
            setEditingContact(contact);
            reset({
                name: contact.name,
                email: contact.email,
                phone: contact.phone || "",
                company: contact.company || "",
                position: contact.position || "",
                countryId: contact.countryId,
            });
        } else {
            setEditingContact(null);
            reset({
                name: "",
                email: "",
                phone: "",
                company: "",
                position: "",
                countryId: countries[0]?.id || "",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
        reset();
    };

    const onSubmit = (data: ContactFormData) => {
        if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this contact?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <>
            {/* Header */}
            <header className="w-full px-4 sm:px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Home</span>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">Contacts</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-xl sm:text-2xl md:text-[28px] font-bold leading-tight">Contacts</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm pt-1">Manage your contacts and relationships</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-[#151f2b] border border-slate-200 dark:border-slate-700 rounded-lg h-10 px-3 w-full sm:w-64 hover:border-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                            <input
                                className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0 w-full placeholder:text-slate-400"
                                placeholder="Search contacts..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => openModal()} className="btn-primary gap-2 justify-center">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>Add Contact</span>
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
                    ) : contacts.length === 0 ? (
                        <div className="card text-center py-12">
                            <span className="material-symbols-outlined text-[48px] text-slate-400">group</span>
                            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">No contacts yet</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Get started by adding your first contact.</p>
                            <button onClick={() => openModal()} className="btn-primary mt-4">
                                Add Contact
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-3 md:hidden">
                                {contacts.map((contact) => (
                                    <div key={contact.id} className="card">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">{contact.name.charAt(0).toUpperCase()}</div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{contact.name}</p>
                                                    {contact.position && <p className="text-xs text-slate-500 dark:text-slate-400">{contact.position}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openModal(contact)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(contact.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-[16px]">mail</span>
                                                <span className="truncate">{contact.email}</span>
                                            </div>
                                            {contact.company && (
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <span className="material-symbols-outlined text-[16px]">business</span>
                                                    <span>{contact.company}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                <span>
                                                    {contact.country?.name} ({contact.country?.code})
                                                </span>
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
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Name</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Company</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Country</th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contacts.map((contact) => (
                                                <tr key={contact.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">{contact.name.charAt(0).toUpperCase()}</div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{contact.name}</p>
                                                                {contact.position && <p className="text-xs text-slate-500 dark:text-slate-400">{contact.position}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{contact.email}</td>
                                                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{contact.company || "-"}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                                                            {contact.country?.name} ({contact.country?.code})
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button onClick={() => openModal(contact)} className="p-2 text-slate-500 hover:text-primary transition-colors">
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(contact.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
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
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{editingContact ? "Edit Contact" : "Add Contact"}</h2>
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
                                <input {...register("email", { required: "Email is required" })} className="input mt-1" type="email" placeholder="john@company.com" />
                                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Phone</label>
                                    <input {...register("phone")} className="input mt-1" placeholder="+1 234 567 890" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">Position</label>
                                    <input {...register("position")} className="input mt-1" placeholder="CEO" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white">Company</label>
                                <input {...register("company")} className="input mt-1" placeholder="Acme Inc." />
                            </div>
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
