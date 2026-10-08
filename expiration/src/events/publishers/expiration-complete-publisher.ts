import { ExpirationCompleteEvent, Subjects, Publisher } from "@qatickets/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;    
}