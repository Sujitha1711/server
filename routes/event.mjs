import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import { requireAuth } from '../middleware/middleware.mjs';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage(); // Use memory storage for handling file uploads
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
        fieldSize: Infinity,  // No limit on field size
    },
});

/// Add an event - Protected route requiring "admin" role
router.post("/add-event", requireAuth(["admin"]), upload.single("pic"), async (req, res) => {
    console.log("Received request:", req.body, req.file);

    try {
        const { title, category, details, date, joinby } = req.body;
        let pic;

        if (req.body.pic && req.body.pic.startsWith('data:image/')) {
            // If a base64 image is provided, use it directly
            pic = req.body.pic;
        } else if (req.file) {
            // If a file is provided, convert it to base64
            pic = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Validate input fields
        if (!title || !category || !details || !date || !joinby || !pic) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Insert the new event into the database
        const collection = await db.collection("events");
        const result = await collection.insertOne({ title, category, details, date, joinby, pic });

        res.status(201).json({ message: "Event added successfully.", eventId: result.insertedId });
    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



// Get event by id
router.get("/:id", async (req, res) => {
    try {
        const eventId = req.params.id;
        const query = { _id: new ObjectId(eventId) };

        const collection = await db.collection("events");
        const result = await collection.findOne(query);

        if (!result) {
            res.status(404).json({ message: "event not found." });
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        console.error("Error fetching event by id:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Update an event - Protected route requiring "admin" role
router.patch("/:id", requireAuth(["admin"]), upload.single("pic"), async (req, res) => {
    const eventId = new ObjectId(req.params.id);

    const query = { _id: eventId };
    const existingEvent = await db.collection("events").findOne(query);

    if (!existingEvent) {
        return res.status(404).json({ message: 'Event not found' });
    }

    // Retrieve the joinedDate from the members collection
    const membersCollection = await db.collection("members");
    const memberData = await membersCollection.findOne({ "events._id": eventId });
    const joinedDate = memberData ? memberData.events.find(event => event._id.equals(eventId))?.joinedDate : null;
    const pic = memberData ? memberData.events.find(event => event._id.equals(eventId))?.pic : null;

    const updates = {
        $set: {
            title: req.body.title || existingEvent.title,
            category: req.body.category || existingEvent.category,
            details: req.body.details || existingEvent.details,
            date: req.body.date || existingEvent.date,
            joinby: req.body.joinby || existingEvent.joinby,
            pic: pic || existingEvent.pic,
            joinedDate: joinedDate || existingEvent.joinedDate
        }
    };
    console.log('Received data:', req.body);
    const result = await db.collection("events").updateOne(query, updates);

    if (result.modifiedCount > 0) {
        // Update members collection
        const membersResult = await db.collection("members").updateMany(
            { "events._id": eventId },
            { $set: { "events.$": { ...updates.$set, _id: eventId } } }
        );

        // Update myevents collection
        const myeventsResult = await db.collection("myevents").updateMany(
            { eventId },
            { $set: { title: updates.$set.title, category: updates.$set.category, details: updates.$set.details, joinby: updates.$set.joinby } }
        );
        res.status(200).json({ message: 'Event updated successfully', membersResult, myeventsResult });
    } else {
        res.status(200).json({ message: 'No changes were made' });
    }
});

router.get("/category/:category", async (req, res) => {
    try {
        const collection = await db.collection("events");
        const query = { category: req.params.category };

        const results = await collection.find(query).toArray();

        if (results.length === 0) {
            res.status(404).send("No event found for the specified category");
        } else {
            res.status(200).send(results);
        }
    } catch (error) {
        console.error("Error fetching event by category:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Get all events
router.get("/", async (req, res) => {
    try {
        const collection = await db.collection("events");
        const results = await collection.find({}).toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching all events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Delete events by id
router.delete("/:id", requireAuth(["admin"]), async (req, res) => {
    try {
        const eventId = req.params.id;
        const query = { _id: new ObjectId(eventId) };

        // Delete the event from the events collection
        const eventsCollection = db.collection("events");
        const result = await eventsCollection.deleteOne(query);

        if (result.deletedCount === 1) {
            // Delete the event from the myevents collection
            await db.collection("myevents").deleteMany({ eventId: new ObjectId(eventId) });

            // Delete the event from the members collection
            await db.collection("members").updateMany(
                { "events._id": new ObjectId(eventId) },
                { $pull: { events: { _id: new ObjectId(eventId) } } }
            );

            res.status(200).json({ message: "Event deleted successfully." });
        } else {
            res.status(404).json({ message: "Event not found." });
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// View member participation in events
router.get("/view-member-participation/:memberId", async (req, res) => {
    try {
        const memberId = new ObjectId(req.params.memberId);

        // Query the "members" collection to get member information
        const memberCollection = await db.collection("members");
        const member = await memberCollection.findOne({ _id: memberId });

        if (!member) {
            return res.status(404).json({ message: "Member not found." });
        }

        res.status(200).json({ member });
    } catch (error) {
        console.error("Error fetching member participation:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Get members who joined a specific event - No authentication for simplicity
router.get("/joined-members/:eventId", requireAuth(["admin"]), async (req, res) => {
    
    try {
        const eventId = new ObjectId(req.params.eventId);

        // Check if the event exists
        const eventCollection = await db.collection("events");
        const event = await eventCollection.findOne({ _id: eventId });

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Query the "myevents" collection to get members who joined the event
        const myeventsCollection = await db.collection("myevents");
        const joinedMembers = await myeventsCollection
            .find({ eventId })
            .toArray();

        // If no members joined, return an empty array
        if (joinedMembers.length === 0) {
            return res.status(200).json({ members: [] });
        }

        // Get member details from the "members" collection
        const memberIds = joinedMembers.map((relation) => new ObjectId(relation.memberId));
        const memberCollection = await db.collection("members");
        const members = await memberCollection
            .find({ _id: { $in: memberIds } })
            .toArray();

        res.status(200).json({ members });
    } catch (error) {
        console.error("Error fetching joined members:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Search events by letters
router.get("/search/:letters", async (req, res) => {
    try {
        const letters = req.params.letters;

        // Construct a query to search for events that contain the specified letters in the title
        const collection = await db.collection("events");
        const query = { title: { $regex: new RegExp(letters, 'i') } }; // 'i' makes the search case-insensitive

        const results = await collection.find(query).toArray();

        if (results.length === 0) {
            res.status(404).send("No events found matching the specified letters");
        } else {
            res.status(200).send(results);
        }
    } catch (error) {
        console.error("Error searching events by letters:", error);
        res.status(500).send("Internal Server Error");
    }
});

export default router;