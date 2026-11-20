// jsdom lacks TextEncoder/TextDecoder, which react-router reads at load time.
import { TextDecoder, TextEncoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });
