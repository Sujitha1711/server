import { describe, it, beforeEach, after } from 'mocha';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import supertest from 'supertest';
import app from '../server.mjs';
import adminsRouter from "../routes/admin.mjs";

const request = supertest(app);

describe('Admin Side Functions', () => {
    let db;
    let mongoMemoryServer;

    before(async () => {
        // Start an in-memory MongoDB server
        mongoMemoryServer = await MongoMemoryServer.create();
        const mongoUri = mongoMemoryServer.getUri();

        // Connect to the in-memory database
        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db();

        // Set the database connection for the admin router
        adminsRouter.db = db;
    });

    beforeEach(async () => {
        // Clear the database before each test
        await db.collection('admin').deleteMany({});
    });


    after(async () => {
        // Stop the in-memory MongoDB server
        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
        }
    });
    // Test case for sending OTP during login
    describe('Admin login', () => {
        it('should send OTP during login', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds


            // Login with the registered user
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678@',
                });

            // Print the response for debugging
            //console.log('Login Response:', loginResponse.body);

            expect(loginResponse.status).to.equal(200);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('OTP sent to your email for verification.');
        });
        it('should get error message when trying to login while otp is still valid', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds


            // Login with the registered user
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678@',
                });

            // Print the response for debugging
            //console.log('Login Response:', loginResponse.body);

            expect(loginResponse.status).to.equal(400);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('Existing OTP is still valid. Wait for it to expire.');
        });
        it('should get error message when trying to login while wrong password', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds


            // Login with the registered user
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'test@gmail.com',
                    password: '123456789',
                });
            // Print the response for debugging
            //console.log('Login Response:', loginResponse.body);

            expect(loginResponse.status).to.equal(401);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('Invalid email or password.');
        });
        it('should get error message when trying to login while wrong email', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds


            // Login with the registered user
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 's@gmail.com',
                    password: '12345678@',
                });

            // Print the response for debugging
            //console.log('Login Response:', loginResponse.body);

            expect(loginResponse.status).to.equal(401);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('Invalid email or password.');
        });
    });
    describe('Admin Verify', () => {
        it('should verify OTP and return JWT token on successful login', async function () {
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                });

            // Log the entire response body for debugging
            // console.log('Login Response Body:', loginResponse.body);

            // Ensure that the response body has the expected structure
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('OTP sent to your email for verification.');

            // Extract the generated OTP from the login response
            // Note: Update this based on the actual structure of your response
            const generatedOTP = loginResponse.body.otp;

            // Introduce a delay of 30 seconds to simulate OTP expiration
            // await new Promise(resolve => setTimeout(resolve, 30000));

            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                    otp: generatedOTP, // Use the extracted OTP from the login response
                });

            // Update the expected status code based on the actual behavior
            expect(verifyResponse.status).to.equal(200); // Update this to 200 if that's the actual status for a successful verification
            // Add more assertions based on your actual response structure
        });


        it('should return an error when OTP is expired during verification', async function () {
            // Simulate an expired OTP
            const expiredOtp = '123456';
            const currentTime = new Date().getTime();
            const expiredTime = currentTime - 10000; // 10 seconds ago

            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                    otp: expiredOtp,
                });

            expect(verifyResponse.status).to.equal(401);
            // Add more assertions based on your actual response structure
        });

        it('should return an error when OTP is incorrect during verification', async function () {
            // Use an incorrect OTP
            const incorrectOtp = '654321';

            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                    otp: incorrectOtp,
                });

            expect(verifyResponse.status).to.equal(401);
        });

        it('should return an error when trying to verify with wrong credentials', async function () {
            // Use wrong email and password combination
            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'wrongemail@example.com',
                    password: 'wrongpassword',
                    otp: '123456',
                });

            expect(verifyResponse.status).to.equal(401);
            // Add more assertions based on your actual response structure
        });
    });
    // Import necessary modules and dependencies

    describe('Admin Update Member', () => {
        let jwtToken; // Store the JWT token for authenticated requests

        beforeEach(async () => {
            // Perform login to get the JWT token
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                });

            // Extract the generated OTP from the login response
            const generatedOTP = loginResponse.body.otp;

            // Simulate OTP verification to get the JWT token
            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                    otp: generatedOTP,
                });

            // Extract the JWT token from the verify response
            jwtToken = verifyResponse.body.token;
        });

        // Test case for updating a member
        it('should update member by id', async function () {
            // Assume you have a member ID for testing, replace 'your_member_id' with an actual member ID
            const memberId = '65a017aadcfee8fcd942e041';
            const updates = {
                position: 'Sub-Com',
                title: 'Member',
            };

            // Perform the update request with the JWT token for authentication
            const updateResponse = await request
                .patch(`/admin/${memberId}`)
                .set('Authorization', `Bearer ${jwtToken}`)
                .send(updates);

            // Ensure the update is successful
            expect(updateResponse.status).to.equal(200);
            expect(updateResponse.body.message).to.equal('Member updated successfully');
        });

        it('should return a message when no changes are made during update', async function () {
            // Assume you have a member ID for testing, replace 'your_member_id' with an actual member ID
            const memberId = '65a017aadcfee8fcd942e041';
            const updates = {
                position: 'Sub-Com',
                title: 'Member',
            };

            // Perform the update request with the JWT token for authentication
            const updateResponse = await request
                .patch(`/admin/${memberId}`)
                .set('Authorization', `Bearer ${jwtToken}`)
                .send(updates);

            // Ensure the server responds with a message indicating no changes were made
            expect(updateResponse.status).to.equal(200);
            expect(updateResponse.body.message).to.equal('No changes were made');
        });
    });
    describe('Admin delete Member', () => {
        let jwtToken; // Store the JWT token for authenticated requests

        beforeEach(async () => {
            // Perform login to get the JWT token
            const loginResponse = await request
                .post('/admin/login')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                });

            // Extract the generated OTP from the login response
            const generatedOTP = loginResponse.body.otp;

            // Simulate OTP verification to get the JWT token
            const verifyResponse = await request
                .post('/admin/verify')
                .send({
                    email: 'suji.palani45@gmail.com',
                    password: '12345678@',
                    otp: generatedOTP,
                });

            // Extract the JWT token from the verify response
            jwtToken = verifyResponse.body.token;
        });

        it('should delete member', async function () {
            const memberId = '65bf6c110d4f6526993ed396';

            // Perform the delete request with the JWT token for authentication
            const deleteResponse = await request
                .delete(`/admin/${memberId}`)
                .set('Authorization', `Bearer ${jwtToken}`);

            // Ensure the server responds with the expected message
            expect(deleteResponse.status).to.equal(200);
            expect(deleteResponse.body.message).to.equal('Member deleted successfully.');

            // Ensure that the member is actually deleted from the database
            const deletedMember = await db.collection('members').findOne({ _id: new ObjectId(memberId) });
            expect(deletedMember).to.be.null; 
        });
    });
});

