import { describe, it, beforeEach, after } from 'mocha';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import supertest from 'supertest';
import app from '../server.mjs'; // Assuming your Express app is exported from server.js
import membersRouter from '../routes/members.mjs';

const request = supertest(app);

describe('Members', () => {
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

        // Set the database connection for the members router
        membersRouter.db = db;
    });

    beforeEach(async () => {
        // Clear the database before each test
        await db.collection('members').deleteMany({});
    });

    after(async () => {
        // Stop the in-memory MongoDB server
        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
        }
    });

    describe('Register New Member', () => {
        it('should register a new member', async () => {
            const response = await request
                .post('/student/register')
                .send({
                    name: 'Tom Doe',
                    email: 'tom.doe@gmail.com', // Same email as the previous user
                    password: '12345678',
                    mobile: '1234567890',
                    course: 'Computer Science',
                    year: "2023",
                    role: 'Student',
                    position: 'Sub-Com',
                    title: 'Member',
                    about: 'I am a student interested in programming.',
                    pic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
                });

            expect(response.status).to.equal(201);
            expect(response.body.message).to.equal('Registration successful.');
            expect(response.body.user).to.be.an('object');
        });

        it('should return error message if duplicate email being used', async () => {
            // Attempt to register another member with the same email
            const response = await request
                .post('/student/register')
                .send({
                    name: 'Another',
                    email: 'tom.doe@gmail.com', // Same email as the previous user
                    password: '12345678',
                    mobile: '9876543210',
                    course: 'Physics',
                    year: "2",
                    role: 'Student',
                    position: 'Sub-Com',
                    title: 'Member',
                    about: 'I am another user.',
                    pic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
                });

            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('message');
            expect(response.body.message).to.equal('Email already in use. Please choose a different email.');
        });
        it('should return error message if fields are empty', async () => {
          
            const response = await request
                .post('/student/register')
                .send({
                    name: 'Another',
                    email: 'doe@gmail.com', 
                    password: '12345678',
                    mobile: '',
                    course: '',
                    year: "2",
                    role: '',
                    position: 'Sub-Com',
                    title: 'Member',
                    about: '',
                    pic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
                });

            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('message');
            expect(response.body.message).to.equal('All fields are required.');
        });
        it('should return error message if password is bellow 8 characters', async () => {
            const response = await request
                .post('/student/register')
                .send({
                    name: 'Another',
                    email: 'we@gmail.com',
                    password: '12',
                    mobile: '9876543210',
                    course: 'Physics',
                    year: "2",
                    role: 'Student',
                    position: 'Sub-Com',
                    title: 'Member',
                    about: 'I am another user.',
                    pic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
                });

            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('message');
            expect(response.body.message).to.equal('Password must be at least 8 characters long.');
        });
    });

    // Test case for sending OTP during login
    // Test case for sending OTP during login
    describe('Student login', () => {
        it('should send OTP during login', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds


            // Login with the registered user
            const loginResponse = await request
                .post('/student/login')
                .send({
                    email: 'tom.doe@gmail.com',
                    password: '12345678',
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
                .post('/student/login')
                .send({
                    email: 'tom.doe@gmail.com',
                    password: '12345678',
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
                .post('/student/login')
                .send({
                    email: 'tom.doe@gmail.com',
                    password: '1234567898',
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
                .post('/student/login')
                .send({
                    email: 't@gmail.com',
                    password: '12345678',
                });

            // Print the response for debugging
            //console.log('Login Response:', loginResponse.body);

            expect(loginResponse.status).to.equal(401);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(loginResponse.body).to.be.an('object');
            expect(loginResponse.body.message).to.equal('Invalid email or password.');
        });
    });
    describe('Student Verify', () => {
        it('should verify OTP and return JWT token on successful login', async function () {
            const loginResponse = await request
                .post('/student/login')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678',
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
                .post('/student/verify')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678',
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
                .post('/student/verify')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678',
                    otp: expiredOtp,
                });

            expect(verifyResponse.status).to.equal(401);
            // Add more assertions based on your actual response structure
        });

        it('should return an error when OTP is incorrect during verification', async function () {
            // Use an incorrect OTP
            const incorrectOtp = '654321';

            const verifyResponse = await request
                .post('/student/verify')
                .send({
                    email: 'test@gmail.com',
                    password: '12345678',
                    otp: incorrectOtp,
                });

            expect(verifyResponse.status).to.equal(401);
        });

        it('should return an error when trying to verify with wrong credentials', async function () {
            // Use wrong email and password combination
            const verifyResponse = await request
                .post('/student/verify')
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

    // Inside the 'Student update' describe block
    describe('Member update', () => {
        const userId = '65a017aadcfee8fcd942e041'; // Replace this with the actual member ID

        it('should update member', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds
            // Update member details
            const updateResponse = await request
                .patch(`/student/${userId}`)
                .send({
                    name: 'Jenny23',
                    email: 'jennyrd20052@gmail.com',
                    mobile: '1234567890',
                    year: '3',
                    about: 'Updated about section',
                    pic: 'images/girl3.jpg'
                });

            // Print the response for debugging
            //console.log('Update Response:', updateResponse.body);

            // Assertions for the update response
            expect(updateResponse.status).to.equal(200);
            // Adjust the following assertions based on the actual success message structure returned by your server
            expect(updateResponse.body).to.be.an('object');

            expect(updateResponse.body.message).to.equal('Member updated successfully');

            // Check if the member details are updated in the database
            const updatedMember = await db.collection('members').findOne({ _id: new ObjectId(userId) });
            // console.log('Updated Member:', updatedMember);

        });
        it('should not update member when no changes are made', async function () {
            this.timeout(50000); // Increase timeout to 10 seconds

            // Attempt to update member details with the same data
            const updateResponse = await request
                .patch(`/student/${userId}`)
                .send({
                    name: 'Jenny23',
                    email: 'jennyrd20052@gmail.com',
                    mobile: '1234567890',
                    year: '3',
                    about: 'Updated about section',
                    pic: 'images/girl3.jpg'
                });

            // Print the response for debugging
            //console.log('Update Response (No Changes):', updateResponse.body);

            // Assertions for the update response when no changes are made
            expect(updateResponse.status).to.equal(200);
            expect(updateResponse.body).to.be.an('object');
            expect(updateResponse.body.message).to.equal('No changes were made');
        });
    });
    // Inside the 'Members API' describe block
    describe('Get All Members', () => {
        it('should get all members', async () => {
            // Assuming you already have some members in your collection

            // Make a request to the endpoint that gets all members
            const response = await request.get('/student');

            // Print the response for debugging
            //console.log('Get All Members Response:', response.body);

            // Assertions for the response
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('array');
            // Add more specific assertions based on the expected structure of the response
        });
    });
    describe('Get Selected Member', () => {
        it('should get selected member', async () => {
            // Assuming you already have some members in your collection
            const userId = '65a017aadcfee8fcd942e041';
            // Make a request to the endpoint that gets a member by id
            const response = await request.get(`/student/${userId}`);

            // Print the response for debugging/
            // console.log('Get Selected Member Response:', response.body);

            // Assertions for the response
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('object');
            // // Add more specific assertions based on the expected structure of the response
            // expect(response.body).to.have.property('_id');
            // expect(response.body).to.have.property('name');
            // Add more specific assertions based on the expected structure of the response
        });
    });
    describe('Delete Member', () => {
        it('should delete a member by ID', async () => {
            // Assuming you already have some members in your collection
            const memberIdToDelete = '65bf6de20d4f6526993ed399';
            // Make a request to the endpoint that deletes a member by ID
            const response = await request.delete(`/student/${memberIdToDelete}`);

            // Print the response for debugging
            // console.log('Delete Member Response:', response.body);

            // Assertions for the response
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('object');
            expect(response.body.message).to.equal('Member deleted successfully.');

        
            // const deletedMember = await db.collection('members').findOne({ _id: new ObjectId(memberIdToDelete) });
            // expect(deletedMember).to.be.null; // Assuming a deleted member should not be found in the database
        });

        it('should handle deletion of non-existing member', async () => {
            // Assuming the member ID below does not exist in your collection
            const nonExistingMemberId = '659d59239c00a12a8b18a621';
            const response = await request.delete(`/student/${nonExistingMemberId}`);

            // Assertions for the response when trying to delete a non-existing member
            expect(response.status).to.equal(404);
            expect(response.body).to.be.an('object');
            expect(response.body.message).to.equal('Member not found.');
        });
    });


});