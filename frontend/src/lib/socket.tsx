"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export type EntityType = "contacts" | "deals" | "activities" | "notes" | "users" | "pipeline-stages" | "dashboard";
export type EventAction = "created" | "updated" | "deleted";

export interface DataChangeEvent {
    entity: EntityType;
    action: EventAction;
    data: any;
    userId?: string;
}

// Map entity types to their React Query keys
const entityQueryKeyMap: Record<EntityType, string[]> = {
    contacts: ["contacts"],
    deals: ["deals", "pipeline"],
    activities: ["activities"],
    notes: ["notes"],
    users: ["users"],
    "pipeline-stages": ["pipeline-stages", "pipeline"],
    dashboard: ["dashboard"],
};

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            autoConnect: true,
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("🔌 Socket connected:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("🔌 Socket disconnected");
        });

        // Listen for generic data changes
        socket.on("data-change", (event: DataChangeEvent) => {
            console.log("📡 Data change received:", event);

            // Get the query keys to invalidate
            const queryKeys = entityQueryKeyMap[event.entity] || [event.entity];

            // Invalidate all related queries
            queryKeys.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: [key] });
            });

            // Also invalidate dashboard when deals change
            if (event.entity === "deals") {
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }
        });

        // Listen for refresh events
        const entities: EntityType[] = ["contacts", "deals", "activities", "notes", "users", "pipeline-stages", "dashboard"];
        entities.forEach((entity) => {
            socket.on(`${entity}:refresh`, () => {
                console.log(`📡 Refresh event for: ${entity}`);
                const queryKeys = entityQueryKeyMap[entity] || [entity];
                queryKeys.forEach((key) => {
                    queryClient.invalidateQueries({ queryKey: [key] });
                });
            });
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    const emit = useCallback((event: string, data?: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    return {
        socket: socketRef.current,
        emit,
    };
}

// Provider component to initialize socket connection
export function SocketProvider({ children }: { children: React.ReactNode }) {
    useSocket();
    return <>{children}</>;
}
