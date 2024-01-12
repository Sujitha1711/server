import express from "express";
import cors from "cors";
import students from "./routes/members.mjs";
import admin from "./routes/admin.mjs";
import event from "./routes/event.mjs";
import feedback from "./routes/feedbackForm.mjs";
import bodyParser from "body-parser";
import notification from "./routes/notification.mjs"

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//routes
app.use("/student", students);
app.use("/admin", admin);
app.use("/event", event);
app.use("/feedback", feedback);
app.use("/notification", notification);

//start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
});

export default app; // add this line to export the Express app
