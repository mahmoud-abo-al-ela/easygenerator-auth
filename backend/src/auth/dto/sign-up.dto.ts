import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  HasLetter,
  HasNumber,
  HasSpecialChar,
} from '../../common/validation/password-rules.js';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  VALIDATION_MESSAGES as MSG,
} from '../../common/validation/validation-contract.js';
import { trim, trimLowercase } from '../../common/validation/transforms.js';

export class SignUpDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(trimLowercase)
  @IsNotEmpty({ message: MSG.email.required })
  @IsEmail({}, { message: MSG.email.invalid })
  email: string;

  @ApiProperty({
    example: 'Jane Doe',
    minLength: NAME_MIN_LENGTH,
    maxLength: NAME_MAX_LENGTH,
  })
  @Transform(trim)
  @IsNotEmpty({ message: MSG.name.required })
  @IsString({ message: MSG.name.required })
  @MinLength(NAME_MIN_LENGTH, { message: MSG.name.tooShort })
  @MaxLength(NAME_MAX_LENGTH, { message: MSG.name.tooLong })
  name: string;

  @ApiProperty({
    example: 'S3cure!pass',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    description:
      'At least one letter, one number and one special character (whitespace does not count)',
  })
  @IsNotEmpty({ message: MSG.password.required })
  @IsString({ message: MSG.password.required })
  @MinLength(PASSWORD_MIN_LENGTH, { message: MSG.password.tooShort })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: MSG.password.tooLong })
  @HasLetter({ message: MSG.password.letter })
  @HasNumber({ message: MSG.password.number })
  @HasSpecialChar({ message: MSG.password.specialChar })
  password: string;
}
