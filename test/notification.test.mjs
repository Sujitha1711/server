import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import supertest from 'supertest';
import app from '../server.mjs';
import notification from '../routes/notification.mjs';
const request = supertest(app);

describe('Notification', () => {
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
        notification.db = db;
    });

    beforeEach(async () => {
        // Clear the database before each test
        await db.collection('notification').deleteMany({});
    });
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
   
    after(async () => {
        // Stop the in-memory MongoDB server
        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
        }
    });
    
    let jwtToken; // Store the JWT token for authenticated requests

   

    // Test case for updating a member
    it('should add notification and notify members', async function () {
        // Assume you have a member ID for testing, replace 'your_member_id' with an actual member ID

        // Perform the update request with the JWT token for authentication
        const addResponse = await request
            .post(`/notification/add`)
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                title: 'Test adding notification',
                notification: 'notification testing',
            });

        // Ensure the notification is added successfully
        expect(addResponse.status).to.equal(201);
        expect(addResponse.body.message).to.equal('notification added successfully.');
    });
    it('should get all notifications', async function () {
        const getResponse = await request
            .get('/notification')

        expect(getResponse.status).to.equal(200);
        expect(getResponse.body).to.be.an('array');
    });
});


