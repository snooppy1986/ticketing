import { Listener } from "./base-listener";
import { Message } from "node-nats-streaming";
import { TicketCreatedEvent } from "./ticket-created-event";
import { Subjects } from "./subject";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated;
    queueGroupName = "payments-service";
    onMessage(data: TicketCreatedEvent['data'], msg: Message): void {
      console.log("Ticket created:", data);
      msg.ack();
    }
  }