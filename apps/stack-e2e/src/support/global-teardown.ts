import { stackDown } from './stack';

export default async function globalTeardown(): Promise<void> {
  stackDown();
}
