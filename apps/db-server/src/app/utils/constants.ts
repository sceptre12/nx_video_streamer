import path from 'path';
import { execSync } from 'child_process';


const STORAGE_PATH = path.join(execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim(), 'apps/db-server/storage');

export {
  STORAGE_PATH
}