// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added
const pool = require('../src/config/db');

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

describe('Testing /api/auth/register API', () => {
  let uniqueEmail;

  // ✅ Positive testcase
  it('Positive: should register a user successfully', done => {
    uniqueEmail = `testuser_${Date.now()}@example.com`;
    const uniqueUsername = `user_${Date.now()}`;

    chai
      .request(server)
      .post('/api/auth/register')
      .send({
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('username', uniqueUsername);
        expect(res.body).to.have.property('email', uniqueEmail);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  after(async () => {
    if (uniqueEmail) {
      try {
        await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
      } catch (err) {
        console.error('Error cleaning up test user:', err);
      }
    }
  });


  // ✅ Negative testcase
  it('Negative: should return 400 for missing required fields', done => {
    chai
      .request(server)
      .post('/api/auth/register')
      .send({
        email: 'invalid@example.com'
        // missing: username, password
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Please fill all fields');
        done();
      });
  });



});

describe('Testing /api/auth/login API', () => {
  let uniqueEmail;

  // ✅ Positive testcase
  it('Positive: should log in a user with valid credentials', done => {
    const timestamp = Date.now();
    uniqueEmail = `loginuser_${timestamp}@example.com`;
    const uniqueUsername = `login_${timestamp}`;
    const password = 'LoginPass123!';

    chai
      .request(server)
      .post('/api/auth/register')
      .send({
        username: uniqueUsername,
        email: uniqueEmail,
        password
      })
      .end((registerErr, registerRes) => {
        expect(registerRes).to.have.status(201);

        chai
          .request(server)
          .post('/api/auth/login')
          .send({
            email: uniqueEmail,
            password
          })
          .end((loginErr, loginRes) => {
            expect(loginRes).to.have.status(200);
            expect(loginRes.body).to.have.property('id');
            expect(loginRes.body).to.have.property('username', uniqueUsername);
            expect(loginRes.body).to.have.property('email', uniqueEmail);
            expect(loginRes.body).to.have.property('token');
            done();
          });
      });
  });

  after(async () => {
    if (uniqueEmail) {
      try {
        await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
      } catch (err) {
        console.error('Error cleaning up test user:', err);
      }
    }
  });

  // ✅ Negative testcase
  it('Negative: should reject invalid credentials', done => {
    chai
      .request(server)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'WrongPassword!'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Invalid credentials');
        done();
      });
  });
});

after(() => {
  server.close();
});
