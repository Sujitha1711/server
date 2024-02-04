import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import supertest from 'supertest';
import app from '../server.mjs';
import feedbacks from '../routes/feedbackForm.mjs';
import sinon from 'sinon';

const request = supertest(app);
let sendEmailMock;

describe('Feedbacks', () => {
    let db;
    let mongoMemoryServer;
    let jwtToken;

    before(async () => {
        // Start an in-memory MongoDB server
        mongoMemoryServer = await MongoMemoryServer.create();
        const mongoUri = mongoMemoryServer.getUri();

        // Connect to the in-memory database
        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db();

        // Set the database connection for the admin router
        feedbacks.db = db;
    });

    beforeEach(async () => {
        // Clear the database before each test
        await db.collection('feedbacks').deleteMany({});
        sendEmailMock = sinon.stub();
    });

    afterEach(() => {
        // Restore the original function after each test
        sinon.restore();

       
    });
    
    after(async () => {
        // Stop the in-memory MongoDB server
        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
        }
    });


    it('should get all feedbacks', async function () {
        const getResponse = await request
            .get('/feedback');

        expect(getResponse.status).to.equal(200);
        expect(getResponse.body).to.be.an('array');
    });
});
