import { stackEnv, stackUp, waitForStack } from './stack';

export default async function globalSetup(): Promise<void> {
  stackEnv();
  stackUp();
  await waitForStack();
}
