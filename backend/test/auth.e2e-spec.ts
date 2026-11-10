import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  AUTH_MESSAGES,
  VALIDATION_MESSAGES as MSG,
} from '../src/common/validation/validation-contract.js';

const PASSWORD = 'S3cure!pass';

describe('Auth (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication<App>;
  let emailCounter = 0;

  const uniqueEmail = () => `user${++emailCounter}@example.com`;

  function cookiesOf(res: request.Response): string[] {
    const header = res.headers['set-cookie'] as string[] | string | undefined;
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  }

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongo.getUri('auth-e2e');
    process.env.JWT_SECRET = 'e2e-secret-that-is-at-least-32-characters-long';

    // Imported after env is set: ConfigModule validates env when AppModule loads.
    const { AppModule } = await import('../src/app.module.js');
    const { configureApp } = await import('../src/app.setup.js');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  describe('POST /auth/sign-up', () => {
    it('creates the user, sets an httpOnly cookie and never returns the hash', async () => {
      const email = uniqueEmail();
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: ` ${email.toUpperCase()} `,
          name: 'Jane Doe',
          password: PASSWORD,
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        email,
        name: 'Jane Doe',
        createdAt: expect.any(String),
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);

      const [cookie] = cookiesOf(res);
      expect(cookie).toMatch(/^access_token=/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it('returns 409 for an email that is already registered', async () => {
      const email = uniqueEmail();
      const body = { email, name: 'Jane Doe', password: PASSWORD };
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(body)
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ ...body, email: email.toUpperCase() })
        .expect(409);
      expect(res.body.message).toBe(AUTH_MESSAGES.emailTaken);
    });

    it.each([
      [
        'invalid email',
        { email: 'nope', name: 'Jane', password: PASSWORD },
        { email: [MSG.email.invalid] },
      ],
      [
        'short name',
        { email: 'a@example.com', name: 'Jo', password: PASSWORD },
        { name: [MSG.name.tooShort] },
      ],
      [
        'long name',
        { email: 'a@example.com', name: 'a'.repeat(51), password: PASSWORD },
        { name: [MSG.name.tooLong] },
      ],
      [
        'weak password',
        { email: 'a@example.com', name: 'Jane', password: 'password' },
        { password: [MSG.password.number, MSG.password.specialChar] },
      ],
      [
        'whitespace as special char',
        { email: 'a@example.com', name: 'Jane', password: 'Pass word1' },
        { password: [MSG.password.specialChar] },
      ],
      [
        'unknown field',
        {
          email: 'a@example.com',
          name: 'Jane',
          password: PASSWORD,
          role: 'admin',
        },
        { role: [MSG.unknownField] },
      ],
      [
        'NoSQL operator',
        { email: { $ne: null }, name: 'Jane', password: PASSWORD },
        { email: [MSG.email.invalid] },
      ],
      [
        'empty body',
        {},
        {
          email: [MSG.email.required],
          name: [MSG.name.required],
          password: [MSG.password.required],
        },
      ],
    ])('returns 400 with field errors for %s', async (_label, body, errors) => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(body)
        .expect(400);
      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: MSG.summary,
        errors: expect.any(Object),
      });
      // Password rules are reported as a checklist; compare order-insensitively.
      for (const [field, messages] of Object.entries(errors)) {
        expect(res.body.errors[field]).toEqual(
          expect.arrayContaining(messages),
        );
        expect(res.body.errors[field]).toHaveLength(messages.length);
      }
      expect(Object.keys(res.body.errors).sort()).toEqual(
        Object.keys(errors).sort(),
      );
    });
  });

  describe('POST /auth/sign-in', () => {
    const email = 'signin@example.com';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email, name: 'Sign In', password: PASSWORD })
        .expect(201);
    });

    it('signs in with a padded, mixed-case email and sets the cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: '  SignIn@Example.com ', password: PASSWORD })
        .expect(200);

      expect(res.body.email).toBe(email);
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);
      expect(cookiesOf(res)[0]).toMatch(/^access_token=.+HttpOnly/i);
    });

    it('returns the same 401 for a wrong password and an unknown email', async () => {
      const wrong = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email, password: 'Wrong!pass1' })
        .expect(401);
      const unknown = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);

      expect(wrong.body.message).toBe(AUTH_MESSAGES.invalidCredentials);
      expect(unknown.body.message).toBe(wrong.body.message);
      expect(cookiesOf(wrong)).toEqual([]);
    });

    it('returns 400 for an empty password without revealing the policy', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email, password: '' })
        .expect(400);
      expect(res.body.errors).toEqual({
        password: [MSG.signInPassword.required],
      });
    });
  });

  describe('login CSRF protection', () => {
    it.each([
      [
        'form-encoded',
        'application/x-www-form-urlencoded',
        'email=signin%40example.com&password=S3cure%21pass',
      ],
      [
        'text/plain',
        'text/plain',
        '{"email":"signin@example.com","password":"S3cure!pass"}',
      ],
    ])(
      'rejects a %s sign-in with 415 and sets no cookie',
      async (_label, type, body) => {
        const res = await request(app.getHttpServer())
          .post('/auth/sign-in')
          .set('Origin', 'https://evil.example')
          .set('Content-Type', type)
          .send(body)
          .expect(415);

        expect(res.body.message).toBe('Send the request body as JSON');
        expect(cookiesOf(res)).toEqual([]);
      },
    );

    it('still allows a body-less sign-out', async () => {
      await request(app.getHttpServer()).post('/auth/sign-out').expect(204);
    });
  });

  describe('session lifecycle', () => {
    it('GET /users/me returns 401 without a cookie', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('GET /users/me returns 401 with a forged cookie', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', 'access_token=not-a-jwt')
        .expect(401);
    });

    it('sign-up -> me -> sign-out -> me', async () => {
      const agent = request.agent(app.getHttpServer());
      const email = uniqueEmail();

      await agent
        .post('/auth/sign-up')
        .send({ email, name: 'Session User', password: PASSWORD })
        .expect(201);

      const me = await agent.get('/users/me').expect(200);
      expect(me.body).toEqual({
        id: expect.any(String),
        email,
        name: 'Session User',
        createdAt: expect.any(String),
      });

      const signOut = await agent.post('/auth/sign-out').expect(204);
      expect(cookiesOf(signOut)[0]).toMatch(
        /^access_token=;.*Expires=Thu, 01 Jan 1970/i,
      );

      await agent.get('/users/me').expect(401);
    });
  });

  it('GET /health returns ok', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });
});
