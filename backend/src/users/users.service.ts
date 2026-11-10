import {
  ConflictException,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';
import { User, type UserDocument } from './schemas/user.schema.js';
import { AUTH_MESSAGES } from '../common/validation/validation-contract.js';

const MONGO_DUPLICATE_KEY = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY
  );
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /** Ensures the unique email index exists before requests are served. */
  async onModuleInit(): Promise<void> {
    await this.userModel.init();
  }

  async create(
    data: Pick<User, 'email' | 'name' | 'passwordHash'>,
  ): Promise<UserDocument> {
    try {
      return await this.userModel.create(data);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(AUTH_MESSAGES.emailTaken);
      }
      throw error;
    }
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) return null;
    return this.userModel.findById(id).exec();
  }
}
