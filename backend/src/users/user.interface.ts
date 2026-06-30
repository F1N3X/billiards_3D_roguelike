import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  pseudo: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
