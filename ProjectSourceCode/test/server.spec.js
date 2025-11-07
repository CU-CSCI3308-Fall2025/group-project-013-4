// ********************** initialize server **********************************
const server = require('../src/index');

// ********************** import libraries ***********************************
const chai = require('chai');
const chaiHttp = require('chai-http');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

chai.should();
chai.use(chaiHttp);
const { expect } = chai;

const dbConfig = {
  user: process.env.DB_USER || 'walletwatch_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'walletwatch',
  password: process.env.DB_PASS || 'walletwatch_pass',
  port: Number(process.env.DB_PORT) || 5432
};

const pool = new Pool(dbConfig);

async function waitForDatabase(attempts = 5, delay = 1000) {
  let remaining = attempts;
  while (remaining > 0) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      remaining -= 1;
      if (remaining === 0) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ********************** default welcome test ****************************
describe('Server!', () => {
  it('Returns the default welcome message', async () => {
    const res = await chai.request(server).get('/welcome');
    expect(res).to.have.status(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.message).to.equal('Welcome!');
  });
});

// *********************** register and login test **************************
describe('Auth APIs', () => {
  before(async function () {
    this.timeout(15000);
    await waitForDatabase();
  });

  describe('Register API', () => {
    it('Positive: creates a new account with valid details', async function () {
      this.timeout(15000);
      const uniqueSuffix = Date.now();
      const payload = {
        username: `lab10_user_${uniqueSuffix}`,
        email: `lab10_${uniqueSuffix}@example.com`,
        password: 'StrongPass!23'
      };

      const res = await chai.request(server).post('/api/auth/register').send(payload);

      expect(res).to.have.status(201);
      expect(res.body).to.include.keys('id', 'username', 'email', 'token');
      expect(res.body.username).to.equal(payload.username);
      expect(res.body.email).to.equal(payload.email);

      await pool.query('DELETE FROM users WHERE email = $1', [payload.email]);
    });

    it('Negative: rejects requests missing required fields', async function () {
      this.timeout(10000);
      const res = await chai
        .request(server)
        .post('/api/auth/register')
        .send({ email: 'invalid@example.com' });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'Please fill all fields');
    });
  });

  describe('Login API', () => {
    let createdUser;
    const password = 'LoginPass!23';

    beforeEach(async () => {
      const uniqueSuffix = Date.now();
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [`lab10_login_${uniqueSuffix}`, `lab10_login_${uniqueSuffix}@example.com`, hashedPassword]
      );
      createdUser = rows[0];
    });

    afterEach(async () => {
      if (createdUser) {
        await pool.query('DELETE FROM users WHERE id = $1', [createdUser.id]);
        createdUser = null;
      }
    });

    it('Positive: authenticates a user with valid credentials', async function () {
      this.timeout(15000);
      const res = await chai
        .request(server)
        .post('/api/auth/login')
        .send({ email: createdUser.email, password });

      expect(res).to.have.status(200);
      expect(res.body).to.include.keys('id', 'username', 'email', 'token');
      expect(res.body.id).to.equal(createdUser.id);
      expect(res.body.username).to.equal(createdUser.username);
      expect(res.body.email).to.equal(createdUser.email);
    });

    it('Negative: rejects requests with incorrect credentials', async function () {
      this.timeout(10000);
      const res = await chai
        .request(server)
        .post('/api/auth/login')
        .send({ email: 'doesnotexist@example.com', password: 'WrongPass!23' });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });
});

after(async () => {
  await pool.end();
  server.close();
});
