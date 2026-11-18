import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_COST } from './config';

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST);

let dummyHash: Promise<string> | undefined;

/** Compare against a throwaway hash so an unknown username costs the same as a wrong password. */
export const dummyCompare = async (password: string): Promise<void> => {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString('hex'), BCRYPT_COST);
  await bcrypt.compare(password, await dummyHash);
};

export const verifyPassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);
