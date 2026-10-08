import { Publisher, PaymentCreatedEvent, Subjects } from "@qatickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    readonly subject = Subjects.PaymentCreated;
}