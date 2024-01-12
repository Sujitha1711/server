import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateOTP from 'generate-otp';
import transporter from '../middleware/nodemailerConfig.mjs';
import { requireAuth } from '../middleware/middleware.mjs';

const router = express.Router();


import { refreshToken } from '../middleware/tokenRefresh.mjs';


router.post('/refresh-token', (req, res) => {
    const clientRefreshToken = req.body.refreshToken;

    try {
        const newTokens = refreshToken(clientRefreshToken);
        res.json(newTokens);
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
// Protected route requiring "admin" role
router.get("/admin-only", requireAuth(["admin"]), (req, res) => {
    const adminId = req.adminId;
    res.status(200).json({ message: 'Access granted to admin-only route', adminId });
});


const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Select the collection
//         const collection = db.collection('admin');

//         // Check if the user exists in the database
//         const admin = await collection.findOne({ email });

//         if (!admin || !(await bcrypt.compare(password, admin.password))) {
//             return res.status(401).json({ message: 'Invalid email or password.' });
//         }

//         // Check if the user has an existing OTP and if it's still valid
//         const currentTime = new Date().getTime();
//         const otpExpirationTime = admin.otpExpirationTime || 0;

//         if (otpExpirationTime > currentTime) {
//             return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
//         }

//         // Generate a new OTP and set the expiration time (30 seconds)
//         const otp = generateOtp();
//         const expirationTime = currentTime + 30 * 1000; // 30 seconds in milliseconds

//         // Save the generated OTP and its expiration time to the user's document in the database
//         await collection.updateOne(
//             { _id: new ObjectId(admin._id) },
//             { $set: { otp, otpExpirationTime: expirationTime } }
//         );

//         console.log('Generated OTP:', otp);

//         // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
//         const mailOptions = {
//             from: 'vibehub_TP@gmail.com',
//             to: admin.email,
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
        const collection = db.collection('admin');

        // Check if the user exists in the database
        const admin = await collection.findOne({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check if the user has an existing OTP and if it's still valid
        const currentTime = new Date().getTime();
        const otpExpirationTime = admin.otpExpirationTime || 0;

        if (otpExpirationTime > currentTime) {
            return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
        }

        // Generate a new OTP and set the expiration time (30 seconds)
        const otp = generateOtp();
        const expirationTime = currentTime + 30 * 1000; // 30 seconds in milliseconds

        // Save the generated OTP and its expiration time to the user's document in the database
        await collection.updateOne(
            { _id: new ObjectId(admin._id) },
            { $set: { otp, otpExpirationTime: expirationTime } }
        );

        console.log('Generated OTP:', otp);

        // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
        const mailOptions = {
            from: 'vibehub_TP@gmail.com',
            to: admin.email,
            subject: 'Login OTP',
            text: `Your OTP for login is: ${otp}. Your otp will expire in 30 secs.`,
        };
        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.error('Error sending email:', eFrror);
        //         return res.status(500).json({ message: 'Error sending OTP email.' });
        //     }
        //     console.log('Email sent:', info.response);

        //     // Return a response to the client indicating that the OTP has been sent
        //     res.status(200).json({ message: 'OTP sent to your email for verification.' });
        // });
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
        const collection = await db.collection("admin");
        const admin = await collection.findOne({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Retrieve the stored OTP and its expiration time associated with the user
        const storedOtp = admin.otp;
        const storedOtpExpirationTime = admin.otpExpirationTime || 0;

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
            { _id: new ObjectId(admin._id) },
            { $set: { otp: null, otpExpirationTime: null } }
        );

        // Generate JWT token
        const token = jwt.sign(
            { adminId: admin._id, email: admin.email, role: admin.role },
            'my-32-character-ultra-secure-and-ultra-long-secret',
            { expiresIn: '2m' }
        );

        const adminInformation = {
            _id: admin._id,
            email: admin.email,
            password: admin.password,
            role: admin.role
        };

        res.status(200).json({ message: "Login successful.", admin: adminInformation, token });
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
        const collection = db.collection('admin');

        // Check if the user exists in the database
        const admin = await collection.findOne({ email });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        // Check if the user has an existing OTP and if it's still valid
        const currentTime = new Date().getTime();
        const otpExpirationTime = admin.otpExpirationTime || 0;

        if (otpExpirationTime > currentTime) {
            return res.status(400).json({ message: 'Existing OTP is still valid. Wait for it to expire.' });
        }

        // Generate a new OTP and set the expiration time (60 seconds)
        const otp = generateOtp();
        const expirationTime = currentTime + 30 * 1000; // 60 seconds in milliseconds

        // Save the generated OTP and its expiration time to the user's document in the database
        await collection.updateOne(
            { _id: new ObjectId(admin._id) },
            { $set: { otp, otpExpirationTime: expirationTime } }
        );

        console.log('Generated OTP:', otp);

        // Send OTP to the user's email using the transporter from nodemailerConfig.mjs
        const mailOptions = {
            from: 'vibehub_TP@gmail.com',
            to: admin.email,
            subject: 'Login OTP',
            text: `Your new OTP for login is: ${otp}. Your otp will expire in 30 secs.`,
        };

        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.error('Error sending email:', error);
        //         return res.status(500).json({ message: 'Error sending OTP email.' });
        //     }
        //     console.log('Email sent:', info.response);

        //     // Return a response to the client indicating that the new OTP has been sent
        //     res.status(200).json({ message: 'New OTP sent to your email for verification.' });
        // });
        res.status(200).json({ message: 'New OTP sent to your email for verification.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// update member by id
router.patch("/:id", requireAuth(["admin"]), async (req, res) => {
    const memberId = new ObjectId(req.params.id);

    const query = { _id: memberId };
    const existingMember = await db.collection("members").findOne(query);

    if (!existingMember) {
        return res.status(404).json({ message: 'Member not found' });
    }

    const updates = {
        $set: {
            position: req.body.position || existingMember.position,
            title: req.body.title || existingMember.title
        }
    };

    const result = await db.collection("members").updateOne(query, updates);

    if (result.modifiedCount > 0) {
        res.status(200).json({ message: 'Member updated successfully' });
    } else {
        res.status(200).json({ message: 'No changes were made' });
    }
});

// Delete member by id
router.delete("/:id", requireAuth(["admin"]), async (req, res) => {
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
// Get member by id
router.get("/:id", async (req, res) => {
    try {
        const adminId = req.params.id;
        const query = { _id: new ObjectId(adminId) };

        const collection = await db.collection("admin");
        const result = await collection.findOne(query);

        if (!result) {
            res.status(404).json({ message: "Admin not found." });
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        console.error("Error fetching admin by id:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



// // Get members who joined a specific event - No authentication for simplicity
// router.get("/joined-members/:eventId", requireAuth(["admin"]), async (req, res) => {
//     try {
//         const eventId = new ObjectId(req.params.eventId);

//         // Check if the event exists
//         const eventCollection = await db.collection("events");
//         const event = await eventCollection.findOne({ _id: eventId });

//         if (!event) {
//             return res.status(404).json({ message: "Event not found." });
//         }

//         // Query the "myevents" collection to get members who joined the event
//         const myeventsCollection = await db.collection("myevents");
//         const joinedMembers = await myeventsCollection
//             .find({ eventId })
//             .toArray();

//         if (joinedMembers.length === 0) {
//             return res.status(404).json({ message: "No members joined this event yet." });
//         }

//         // Get member details from the "members" collection
//         const memberIds = joinedMembers.map((relation) => new ObjectId(relation.memberId));
//         const memberCollection = await db.collection("members");
//         const members = await memberCollection
//             .find({ _id: { $in: memberIds } })
//             .toArray();

//         res.status(200).json({ members });
//     } catch (error) {
//         console.error("Error fetching joined members:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });


export default router;
