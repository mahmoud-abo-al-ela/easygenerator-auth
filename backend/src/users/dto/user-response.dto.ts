import { ApiProperty } from '@nestjs/swagger';
import type { UserDocument } from '../schemas/user.schema.js';

export class UserResponseDto {
  @ApiProperty({ example: '665f1c2e9b1d4a3f8c0e1a2b' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty()
  createdAt: Date;
}

/** Explicit allow-list mapping, so internal fields like passwordHash can never leak. */
export function toUserResponse(user: UserDocument): UserResponseDto {
  return {
    id: user.id as string,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
