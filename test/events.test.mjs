import { describe, it, beforeEach, after } from 'mocha';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import supertest from 'supertest';
import app from '../server.mjs';
import events from "../routes/event.mjs";

describe('events', () => {
    let db;
    let mongoMemoryServer;
    let request;
    let jwtToken; // Store the JWT token for authenticated requests
    before(async () => {
        // Start an in-memory MongoDB server
        mongoMemoryServer = await MongoMemoryServer.create();
        const mongoUri = mongoMemoryServer.getUri();

        // Connect to the in-memory database
        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db();

        // Set the database connection for the events router
        events.db = db;

        // Create a supertest request agent
        request = supertest(app);
    });

    beforeEach(async () => {
        // Clear the database before each test
        await db.collection('events').deleteMany({});
       
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

    it('should get all events', async function () {
        const getResponse = await request
            .get('/event');

        expect(getResponse.status).to.equal(200);
        expect(getResponse.body).to.be.an('array');
    });

    it('should get event by id', async function () {

        const eventId = ('658fd77181c87a3f8fc44a6b');

        // Get the event by id
        const getEventResponse = await request
            .get(`/event/${eventId}`);

        expect(getEventResponse.status).to.equal(200);
    });

    it('should get events by category', async function () {
        // Get events by category
        const getCategoryEventsResponse = await request
            .get('/event/category/Volunteer');

        expect(getCategoryEventsResponse.status).to.equal(200);
        expect(getCategoryEventsResponse.body).to.be.an('array').that.has.lengthOf.at.least(1);
    });

    it('should search events by search', async function () {
        // Search events by letters
        const searchEventsResponse = await request
            .get('/event/search/In');

        expect(searchEventsResponse.status).to.equal(200);
        expect(searchEventsResponse.body).to.be.an('array').that.has.lengthOf.at.least(1);
    });
    it('should return member information if the member exists', async () => {

        const response = await request
            .get('/event/view-member-participation/65bd27d1f2b33f2fab4bcd65');
        expect(response.status).to.equal(200);
        // expect(response.body).to.have.property('member');
    });

    it('should return a 404 status if the member does not exist', async () => {

        const response = await request.get('/event/view-member-participation/65bd27d1f2b33f2fab4bcd62');
        expect(response.status).to.equal(404);
        //expect(response.body).to.have.property('message', 'Member not found.');
    });

    it('should handle internal server errors gracefully', async () => {
        // Mocking an internal server error by using an invalid member ID
        const response = await request.get('/event/view-member-participation/invalidMemberId');
        expect(response.status).to.equal(500);
        //expect(response.body).to.have.property('message', 'Internal Server Error');
    });
    it('should return members who joined a specific event for an authenticated admin', async () => {


        //const eventId = "658fd77181c87a3f8fc44a6b"; // Replace with an existing event ID in your database

        const response = await request.get('/event/joined-members/658fd77181c87a3f8fc44a6b').set('Authorization', `Bearer ${jwtToken}`);
        expect(response.status).to.equal(200);
        // expect(response.body).to.have.property('members').to.be.an('array');
    });

    it('should return a 404 status if the event does not exist', async () => {
        const nonExistentEventId = "658fd77181c87a3f8fc42346"; // Replace with a non-existent event ID

        const response = await request.get(`/joined-members/${nonExistentEventId}`).set('Authorization', `Bearer ${jwtToken}`);
        expect(response.status).to.equal(404);
        //expect(response.body).to.have.property('message', 'Event not found.');
    });
});
