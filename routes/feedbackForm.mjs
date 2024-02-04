import express from "express";
import db from "../db/conn.mjs";
// import { ObjectId } from "mongodb"; 
import { requireAuth } from '../middleware/middleware2.mjs';
import transporter from '../middleware/nodemailerConfig.mjs';


const router = express.Router();

// Add a feedback 
router.post("/add", requireAuth(["Student"]), async (req, res) => {
    try {
        const { topic, feedback } = req.body;

        // Validate input fields
        if (!topic || !feedback) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const senderEmail = req.userEmail; 
        console.log('Sender email:', senderEmail);

        // Get the current date in ISO format
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();

        // Insert the new feedback into the database along with the current date
        const collection = await db.collection("feedbacks");
        const result = await collection.insertOne({ topic, feedback, date: formattedDate });
        // Send a thank-you email to the sender
        await sendThankYouEmail(senderEmail);

        res.status(201).json({ message: "Feedback added successfully.", feedbackID: result.insertedId });
    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



export const sendThankYouEmail = async (senderEmail) => {
    try {
        const mailOptions = {
            from: 'VibeHub_TP@gmail.com',
            to: senderEmail,
            subject: 'Submission Of Feedback',
            text: 'Thank you for submitting your feedback. We appreciate it!',
        };

        await transporter.sendMail(mailOptions);
        console.log('Thank-you email sent successfully.');
    } catch (error) {
        console.error('Error sending thank-you email:', error);
    }
};

// Get all feedbacks
router.get("/", async (req, res) => {
    try {
        const collection = await db.collection("feedbacks");
        const results = await collection.find({}).toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching all feedbacks:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
