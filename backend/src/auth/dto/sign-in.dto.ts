import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { VALIDATION_MESSAGES as MSG } from '../../common/validation/validation-contract.js';
import { trimLowercase } from '../../common/validation/transforms.js';

export class SignInDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Transform(trimLowercase)
  @IsNotEmpty({ message: MSG.email.required })
  @IsEmail({}, { message: MSG.email.invalid })
  email: string;

  /** Only checked for presence, so sign-in errors don't reveal the password policy. */
  @ApiProperty({ example: 'S3cure!pass' })
  @IsNotEmpty({ message: MSG.signInPassword.required })
  @IsString({ message: MSG.signInPassword.required })
  password: string;
}
