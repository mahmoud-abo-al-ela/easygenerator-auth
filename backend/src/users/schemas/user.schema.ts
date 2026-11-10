import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

// Defense in depth: if a document is ever serialized directly, the hash is stripped.
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    // `ret` is a plain object created for serialization, so mutating it is safe.
    const safe = ret as Partial<typeof ret>;
    delete safe._id;
    delete safe.passwordHash;
    return safe;
  },
});
