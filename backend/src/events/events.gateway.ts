import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";

export type EntityType = "contacts" | "deals" | "activities" | "notes" | "users" | "pipeline-stages" | "dashboard";
export type EventAction = "created" | "updated" | "deleted";

export interface DataChangeEvent {
    entity: EntityType;
    action: EventAction;
    data: any;
    userId?: string;
}

@WebSocketGateway({
    cors: {
        origin: "*",
        credentials: true,
    },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Map<string, Socket>();

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    /**
     * Emit a data change event to all connected clients
     */
    emitDataChange(event: DataChangeEvent) {
        const eventName = `${event.entity}:${event.action}`;
        console.log(`Emitting event: ${eventName}`, event.data?.id || "");

        // Emit specific event (e.g., 'contacts:created')
        this.server.emit(eventName, event.data);

        // Also emit a generic 'data-change' event for easy subscription
        this.server.emit("data-change", event);
    }

    /**
     * Emit event to refresh a specific entity list
     */
    emitRefresh(entity: EntityType) {
        console.log(`Emitting refresh for: ${entity}`);
        this.server.emit(`${entity}:refresh`, { entity });
    }
}
