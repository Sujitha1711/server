// import { describe, it, beforeEach, after } from 'mocha';
// import { expect } from 'chai';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { MongoClient } from 'mongodb';
// import { ObjectId } from 'mongodb';
// import supertest from 'supertest';
// import app from '../server.mjs'; // Assuming your Express app is exported from server.js
// import membersRouter from '../routes/members.mjs';

// const request = supertest(app);
// describe('Members', () => {
//     let db;
//     let mongoMemoryServer;

//     before(async () => {
//         // Start an in-memory MongoDB server
//         mongoMemoryServer = await MongoMemoryServer.create();
//         const mongoUri = mongoMemoryServer.getUri();

//         // Connect to the in-memory database
//         const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
//         await client.connect();
//         db = client.db();

//         // Set the database connection for the members router
//         membersRouter.db = db;
//     });

//     beforeEach(async () => {
//         // Clear the database before each test
//         await db.collection('members').deleteMany({});
//     });

//     after(async () => {
//         // Stop the in-memory MongoDB server
//         await mongoMemoryServer.stop();
//     });
//     describe('Feedback Form', () => {
//         let jwtToken; // Store the JWT token for authenticated requests

//         beforeEach(async () => {
//             // Perform login to get the JWT token
//             const loginResponse = await request
//                 .post('/student/login')
//                 .send({
//                     email: 'test@gmail.com',
//                     password: '12345678',
//                 });

//             // Extract the generated OTP from the login response
//             const generatedOTP = loginResponse.body.otp;

//             // Simulate OTP verification to get the JWT token
//             const verifyResponse = await request
//                 .post('/admin/verify')
//                 .send({
//                     email: 'test@gmail.com',
//                     password: '12345678',
//                     otp: generatedOTP,
//                 });

//             // Extract the JWT token from the verify response
//             jwtToken = verifyResponse.body.token;
//         });

//         // Test case for updating a member
//         it('should send feedback form', async function () {
//             // Assume you have a member ID for testing, replace 'your_member_id' with an actual member ID
//             // const memberId = '65a017aadcfee8fcd942e041';
//             const add = {
//                 position: 'Sub-Com',
//                 title: 'Member',
//             };

//             // Perform the update request with the JWT token for authentication
//             const addResponse = await request
//                 .add(`/admin/${memberId}`)
//                 .set('Authorization', `Bearer ${jwtToken}`)
//                 .send(updates);

//             // Ensure the update is successful
//             expect(updateResponse.status).to.equal(200);
//             expect(updateResponse.body.message).to.equal('Member updated successfully');
//         });

//         it('should return a message when no changes are made during update', async function () {
//             // Assume you have a member ID for testing, replace 'your_member_id' with an actual member ID
//             const memberId = '65a017aadcfee8fcd942e041';
//             const updates = {
//                 position: 'Sub-Com',
//                 title: 'Member',
//             };

//             // Perform the update request with the JWT token for authentication
//             const updateResponse = await request
//                 .patch(`/admin/${memberId}`)
//                 .set('Authorization', `Bearer ${jwtToken}`)
//                 .send(updates);

//             // Ensure the server responds with a message indicating no changes were made
//             expect(updateResponse.status).to.equal(200);
//             expect(updateResponse.body.message).to.equal('No changes were made');
//         });
//     });
// });


