import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
//import generateOTP from 'generate-otp';
import transporter from '../middleware/nodemailerConfig.mjs';
import { requireAuth } from '../middleware/middleware2.mjs';
const router = express.Router();
// import { refreshToken } from '../middleware/tokenRefresh.mjs';

import multer from 'multer';

// Secret key for JWT
export const secretKey = "my-32-character-ultra-secure-and-ultra-long-secret";


// Protected route requiring "student" role
router.get("/member-only", requireAuth(["Student"]), (req, res) => {
    const userId = req.userId;
    res.status(200).json({ message: 'Access granted to member-only route', userId });
});

// Register new member
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, mobile, course, year, role, position, title, about, pic } = req.body;

        // Validate input fields
        if (!name || !email || !password || !mobile || !course || !year || !role || !position || !title || !about || !pic) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if email already exists
        const collection = await db.collection("members");
        const existingUser = await collection.findOne({ email });

        // Change your server code to ensure a consistent error structure
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use. Please choose a different email.' });
        }


        // Validate password length
        // In your server code
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }


        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set a default role if none is provided
        const defaultRole = "Student";
        const defaultPosition = "Sub-Com";
        const defaultTitle = "Member";

        // Set a default image URL
        const defaultPic = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

        // Set a default value for joinedEventsCount
        const defaultJoinedEventsCount = 0;

        // Create a new member document
        const newDocument = {
            name,
            email,
            password: hashedPassword,
            mobile,
            course,
            year,
            role: role || defaultRole,
            position: position || defaultPosition,
            title: title || defaultTitle,
            about,
            pic: pic || defaultPic,
            joinedEventsCount: defaultJoinedEventsCount,
        };

        // Insert the new member into the database
        const result = await collection.insertOne(newDocument);

        // Return the user's information and token in the response
        const userInformation = {
            _id: result.insertedId,
            name,
            email,
            password,
            mobile,
            course,
            year,
            role: newDocument.role,
            position: newDocument.position,
            title: newDocument.title,
            about,
            pic: defaultPic,
            joinedEventsCount: defaultJoinedEventsCount,
        };

        res.status(201).json({ message: "Registration successful.", user: userInformation });
    } catch (error) {
        console.error("Error registering new member:", error);
        res.status(500).send("Internal Server Error");
    }
});

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Select the collection
//         const collection = db.collection('members');

//         // Check if the user exists in the database
//         const user = await collection.findOne({ email });

//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: 'Invalid email or password.' });
//         }

//         // Check if the user has an existing OTP and if it's still valid
//         const currentTime = new Date().getTime();
//         const otpExpirationTime = user.otpExpirationTime || 0;

//         if (otpExpirationTime > currentTime) {
//             return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
//         }

//         // Generate a new OTP and set the expiration time (60 seconds)
//         const otp = generateOtp();
//         const expirationTime = currentTime + 30 * 1000; // 60 seconds in milliseconds

//         // Save the generated OTP and its expiration time to the user's document in the database
//         await collection.updateOne(
//             { _id: new ObjectId(user._id) },
//             { $set: { otp, otpExpirationTime: expirationTime } }
//         );

//         console.log('Generated OTP:', otp);

//         // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
//         const mailOptions = {
//             from: 'vibehub_TP@gmail.com',
//             to: user.email,
//             subject: 'Login OTP',
//             text: `Your OTP for login is: ${otp}. Your otp will expire in 30 secs.`,
//         };

//         // transporter.sendMail(mailOptions, (error, info) => {
//         //     if (error) {
//         //         console.error('Error sending email:', error);
//         //         return res.status(500).json({ message: 'Error sending OTP email.' });
//         //     }
//         //     console.log('Email sent:', info.response);

//         //     // Return a response to the client indicating that the OTP has been sent
//         //     res.status(200).json({ message: 'OTP sent to your email for verification.' });
//         // });
//         res.status(200).json({ message: 'OTP sent to your email for verification.' });
//     } catch (error) {
//         console.error('Error logging in:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Select the collection
        const collection = db.collection('members');

        // Check if the user exists in the database
        const user = await collection.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check if the user has an existing OTP and if it's still valid
        const currentTime = new Date().getTime();
        const otpExpirationTime = user.otpExpirationTime || 0;

        if (otpExpirationTime > currentTime) {
            return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
        }

        // Generate a new OTP and set the expiration time (30 seconds)
        const otp = generateOtp();
        const expirationTime = currentTime + 30 * 1000; // 30 seconds in milliseconds

        // Save the generated OTP and its expiration time to the user's document in the database
        await collection.updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { otp, otpExpirationTime: expirationTime } }
        );

        console.log('Generated OTP:', otp);

        // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
        const mailOptions = {
            from: 'vibehub_TP@gmail.com',
            to: user.email,
            subject: 'Login OTP',
            text: `Your OTP for login is: ${otp}. Your otp will expire in 30 secs.`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', eFrror);
                return res.status(500).json({ message: 'Error sending OTP email.' });
            }
            console.log('Email sent:', info.response);

            // Return a response to the client indicating that the OTP has been sent
            res.status(200).json({ message: 'OTP sent to your email for verification.' });
        });
        // Send the response with the generated OTP
        res.status(200).json({ message: 'OTP sent to your email for verification.', otp });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.post("/verify", async (req, res) => {
    console.log('Received request to /verify:', req.headers);
    try {
        const { email, password, otp } = req.body;

        // Check if the user exists in the database
        const collection = await db.collection("members");
        const user = await collection.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Retrieve the stored OTP and its expiration time associated with the user
        const storedOtp = user.otp;
        const storedOtpExpirationTime = user.otpExpirationTime || 0;

        // Verify entered OTP and check if it's still valid
        const currentTime = new Date().getTime();
        if (otp !== storedOtp || storedOtpExpirationTime < currentTime) {
            if (storedOtpExpirationTime < currentTime) {
                console.log('OTP has expired. Please request a new OTP.');
                return res.status(401).json({ message: 'OTP has expired. Please request a new OTP.' });
            }
            console.log('Invalid OTP.');
            return res.status(401).json({ message: 'Invalid OTP.' });
        }



        // Clear the OTP and its expiration time after successful verification
        await collection.updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { otp: null, otpExpirationTime: null } }
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            'my-32-character-ultra-secure-and-ultra-long-secret',
            { expiresIn: '2m' }
        );

        // Return the user's information and token in the response
        const userInformation = {
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            mobile: user.mobile,
            course: user.course,
            year: user.year,
            role: user.role,
            position: user.position,
            title: user.title,
            about: user.about,
            pic: user.pic,
        };

        res.status(200).json({ message: "Login successful.", user: userInformation, token });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Inside your server-side /resend route handler
router.post("/resend", async (req, res) => {
    try {
        const { email } = req.body;

        // Select the collection
        const collection = db.collection('members');

        // Check if the user exists in the database
        const user = await collection.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the user has an existing OTP and if it's still valid
        const currentTime = new Date().getTime();
        const otpExpirationTime = user.otpExpirationTime || 0;

        if (otpExpirationTime > currentTime) {
            return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
        }

        // Generate a new OTP and set the expiration time (60 seconds)
        const otp = generateOtp();
        const expirationTime = currentTime + 30 * 1000; // 60 seconds in milliseconds

        // Save the generated OTP and its expiration time to the user's document in the database
        await collection.updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { otp, otpExpirationTime: expirationTime } }
        );

        console.log('Generated OTP:', otp);

        // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
        const mailOptions = {
            from: 'vibehub_TP@gmail.com',
            to: user.email,
            subject: 'Login OTP',
            text: `Your new OTP for login is: ${otp}. Your otp will expire in 30 secs.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending OTP email.' });
            }
            console.log('Email sent:', info.response);

            // Return a response to the client indicating that the new OTP has been sent
            res.status(200).json({ message: 'New OTP sent to your email for verification.' });
        });
        res.status(200).json({ message: 'New OTP sent to your email for verification.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



const storage = multer.memoryStorage(); // Use memory storage for handling file uploads
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 5MB limit
    },
});

// update member by id
router.patch("/:id", upload.single('pic'), async (req, res) => {
    const memberId = new ObjectId(req.params.id);

    const query = { _id: memberId };
    const existingMember = await db.collection("members").findOne(query);

    if (!existingMember) {
        return res.status(404).json({ message: 'Member not found' });
    }

    const updates = {
        $set: {
            name: req.body.name || existingMember.name,
            email: req.body.email || existingMember.email,
            password: req.body.password || existingMember.password,
            mobile: req.body.mobile || existingMember.mobile,
            year: req.body.year || existingMember.year,
            about: req.body.about || existingMember.about,
        }
    };

    // Check if pic is a base64-encoded string
    if (req.body.pic && req.body.pic.startsWith('data:images/')) {
        // Decode the base64 image and save to the member's profile
        updates.$set.pic = req.file.buffer;
        // updates.$set.pic = Buffer.from(req.body.pic.split(',')[1], 'base64');
    } else if (req.body.pic) {
        // Assume it's a URL or local file path, and save it as is
        updates.$set.pic = req.body.pic;
    }

    const result = await db.collection("members").updateOne(query, updates);

    if (result.modifiedCount > 0) {
        res.status(200).json({ message: 'Member updated successfully' });
    } else {
        res.status(200).json({ message: 'No changes were made' });
    }
});

//get all members
router.get("/", async (req, res) => {
    let collection = await db.collection("members");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});

// Get member by id
router.get("/:id", async (req, res) => {
    try {
        const memberId = req.params.id;
        const query = { _id: new ObjectId(memberId) };

        const collection = await db.collection("members");
        const result = await collection.findOne(query);

        if (!result) {
            res.status(404).json({ message: "Member not found." });
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        console.error("Error fetching member by id:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// get members by position
router.get("/position/:position", async (req, res) => {
    try {
        const collection = await db.collection("members");
        const query = { position: req.params.position };

        const results = await collection.find(query).toArray();

        if (results.length === 0) {
            res.status(404).send("No members found for the specified position");
        } else {
            res.status(200).send(results);
        }
    } catch (error) {
        console.error("Error fetching members by position:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Delete member by id
router.delete("/:id", async (req, res) => {
    try {
        const memberId = req.params.id;
        const query = { _id: new ObjectId(memberId) };

        const collection = db.collection("members");
        const result = await collection.deleteOne(query);

        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Member deleted successfully." });
        } else {
            res.status(404).json({ message: "Member not found." });
        }
    } catch (error) {
        console.error("Error deleting member:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Join an event - No authentication for simplicity
router.post("/join-event/:memberId/:eventId", async (req, res) => {
    try {
        const memberId = req.params.memberId;
        const eventId = new ObjectId(req.params.eventId);

        // Check if the event exists
        const eventCollection = await db.collection("events");
        const event = await eventCollection.findOne({ _id: eventId });

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Check if the member is already joined
        const myeventsCollection = await db.collection("myevents");
        const existingRelationship = await myeventsCollection.findOne({ memberId, eventId });

        if (existingRelationship) {
            return res.status(400).json({ message: "You have already joined this event." });
        }

        const joinedDate = new Date();
        const formattedDate = joinedDate.toLocaleDateString();
        await myeventsCollection.insertOne({ memberId, eventId, joinedDate: formattedDate });

        // Fetch the event details
        const eventDetails = await eventCollection.findOne({ _id: eventId });

        // Update the member's events array
        const memberCollection = await db.collection("members");
        await memberCollection.updateOne(
            { _id: new ObjectId(memberId) },
            { $push: { events: { ...eventDetails, joinedDate: formattedDate } }, $inc: { joinedEventsCount: 1 } }
        );

        res.status(201).json({ message: "Event joined successfully." });
    } catch (error) {
        console.error("Error joining event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


export default router;