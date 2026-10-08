import { Publisher, Subjects, TicketCreatedEvent } from "@qatickets/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated;
}


