import express, { Request, Response } from "express";
import "express-async-errors";
import cookieSession from "cookie-session";
import { createTicketRouter } from "./routes/new";
import { showTicketRouter } from "./routes/show";
import { indexTicketRouter } from "./routes";
import { updateTicketRouter } from "./routes/update";

import { errorHandler, NotFoundError, currentUser } from "@qatickets/common";


const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieSession({
  signed: false,
  secure: process.env.NODE_ENV !== "test",
}));

app.use(currentUser);

app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(indexTicketRouter);
app.use(updateTicketRouter);

app.all("*", (req: Request, res: Response) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };