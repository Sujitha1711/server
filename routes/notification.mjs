import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import { requireAuth } from '../middleware/middleware.mjs';
import transporter from '../middleware/nodemailerConfig.mjs';



const router = express.Router();

// Add a notification 
router.post("/add", requireAuth(["admin"]), async (req, res) => {
  try {
    const { title, notification } = req.body;

    // Validate input fields
    if (!title || !notification) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get the current date in ISO format
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();

    // Insert the new notification into the database along with the current date
    const collection = await db.collection("notification");
    const result = await collection.insertOne({ title, notification, date: formattedDate });

    // Send a thank-you email to the sender
    await sendNotificationToAllMembers(title, notification);

    res.status(201).json({ message: "notification added successfully.", notificationID: result.insertedId });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const getMembersEmails = async () => {
  try {
    const collection = await db.collection('members');
    const members = await collection.find({}).toArray();

    // Extract email addresses from members
    const memberEmails = members.map((member) => member.email);

    return memberEmails;
  } catch (error) {
    console.error('Error getting members emails:', error);
    return [];
  }
};


const sendNotificationToAllMembers = async (title, notification) => {
  try {
    const members = await getMembersEmails(); // Implement this function to get all member emails

    members.forEach(async (memberEmail) => {
      const mailOptions = {
        from: 'VibeHub_TP@gmail.com',
        to: memberEmail,
        subject: `New Notification: ${title}`,
        text: notification,
      };

      await transporter.sendMail(mailOptions);
    });

    console.log('Notification email sent to all members successfully.');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};


// Get all notification
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("notification");
    const results = await collection.find({}).toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching all notification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all notification
router.get("/:id", async (req, res) => {
  try {
    const notificationID = req.params.id;
    const query = { _id: new ObjectId(notificationID) };

    const collection = await db.collection("notification");
    const result = await collection.findOne(query);

    if (!result) {
      res.status(404).json({ message: "notification not found." });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error fetching notification by id:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
export default router;