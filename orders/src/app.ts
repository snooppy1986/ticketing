import express, { Request, Response } from "express";
import "express-async-errors";
import cookieSession from "cookie-session";
import { newOrdersRouter } from "./routes/new";
import { showOrdersRouter } from "./routes/show";
import { indexOrdersRouter } from "./routes";
import { deleteOrdersRouter } from "./routes/delete";

import { errorHandler, NotFoundError, currentUser } from "@qatickets/common";


const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieSession({
  signed: false,
  secure: process.env.NODE_ENV !== "test",
}));

app.use(currentUser);

app.use(newOrdersRouter);
app.use(showOrdersRouter);
app.use(indexOrdersRouter);
app.use(deleteOrdersRouter);

app.all("*", (req: Request, res: Response) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };