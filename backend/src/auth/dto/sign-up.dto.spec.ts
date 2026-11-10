import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { toFieldErrors } from '../../common/validation/validation-exception.factory.js';
import { VALIDATION_MESSAGES as MSG } from '../../common/validation/validation-contract.js';
import { SignInDto } from './sign-in.dto.js';
import { SignUpDto } from './sign-up.dto.js';

const valid = {
  email: 'jane@example.com',
  name: 'Jane',
  password: 'S3cure!pass',
};

function signUpErrors(input: Record<string, unknown>) {
  return toFieldErrors(validateSync(plainToInstance(SignUpDto, input)));
}

function signInErrors(input: Record<string, unknown>) {
  return toFieldErrors(validateSync(plainToInstance(SignInDto, input)));
}

describe('SignUpDto', () => {
  it('accepts a valid payload', () => {
    expect(signUpErrors(valid)).toEqual({});
  });

  it('trims and lowercases the email and trims the name', () => {
    const dto = plainToInstance(SignUpDto, {
      ...valid,
      email: '  Jane@Example.COM ',
      name: '  Jane  ',
    });
    expect(dto.email).toBe('jane@example.com');
    expect(dto.name).toBe('Jane');
  });

  describe('email', () => {
    it.each([undefined, '', '   '])(
      'asks for the email when it is %j',
      (email) => {
        expect(signUpErrors({ ...valid, email })).toEqual({
          email: [MSG.email.required],
        });
      },
    );

    it('explains the expected format for an invalid email', () => {
      expect(signUpErrors({ ...valid, email: 'not-an-email' })).toEqual({
        email: [MSG.email.invalid],
      });
    });
  });

  describe('name', () => {
    it.each([undefined, '', '    '])(
      'asks for the name when it is %j',
      (name) => {
        expect(signUpErrors({ ...valid, name })).toEqual({
          name: [MSG.name.required],
        });
      },
    );

    it.each([
      ['Jo', MSG.name.tooShort],
      ['   Jo   ', MSG.name.tooShort],
      ['a'.repeat(51), MSG.name.tooLong],
    ])('rejects %j', (name, message) => {
      expect(signUpErrors({ ...valid, name })).toEqual({ name: [message] });
    });

    it('accepts names of exactly 3 and 50 characters', () => {
      expect(signUpErrors({ ...valid, name: 'Ann' })).toEqual({});
      expect(signUpErrors({ ...valid, name: 'a'.repeat(50) })).toEqual({});
    });
  });

  describe('password', () => {
    it('asks for a password when it is missing', () => {
      expect(signUpErrors({ ...valid, password: '' })).toEqual({
        password: [MSG.password.required],
      });
    });

    it.each([
      ['Abcdefg!', [MSG.password.number]],
      ['1234567!', [MSG.password.letter]],
      ['Abcdefg1', [MSG.password.specialChar]],
      ['Abc defg1', [MSG.password.specialChar]],
      ['Ab1!xyz', [MSG.password.tooShort]],
      [`A1!${'a'.repeat(126)}`, [MSG.password.tooLong]],
    ])('reports only the unmet rule for %j', (password, messages) => {
      expect(signUpErrors({ ...valid, password })).toEqual({
        password: messages,
      });
    });

    it('lists every unmet rule at once, like a checklist', () => {
      const { password } = signUpErrors({ ...valid, password: 'abc' });
      expect(password).toHaveLength(3);
      expect(password).toEqual(
        expect.arrayContaining([
          MSG.password.tooShort,
          MSG.password.number,
          MSG.password.specialChar,
        ]),
      );
    });

    it.each([
      ['Abcdef1!', '8 characters'],
      ['Pass word 1!', 'contains spaces plus a real special character'],
      [`A1!${'a'.repeat(125)}`, '128 characters'],
    ])('accepts %j (%s)', (password) => {
      expect(signUpErrors({ ...valid, password })).toEqual({});
    });
  });

  it('reports every invalid field together', () => {
    expect(
      Object.keys(
        signUpErrors({ email: 'x', name: 'J', password: 'short' }),
      ).sort(),
    ).toEqual(['email', 'name', 'password']);
  });
});

describe('SignInDto', () => {
  it('normalizes the email and only requires a non-empty password', () => {
    const dto = plainToInstance(SignInDto, {
      email: ' Jane@Example.com ',
      password: 'x',
    });
    expect(dto.email).toBe('jane@example.com');
    expect(validateSync(dto)).toEqual([]);
  });

  it('uses sign-in wording for a missing password, without revealing the policy', () => {
    expect(signInErrors({ email: 'jane@example.com', password: '' })).toEqual({
      password: [MSG.signInPassword.required],
    });
  });

  it('asks for the email when it is missing', () => {
    expect(signInErrors({ password: 'x' })).toEqual({
      email: [MSG.email.required],
    });
  });
});
