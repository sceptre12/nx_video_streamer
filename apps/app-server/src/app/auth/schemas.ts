const credentials = {
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
} as const;

export const registerSchema = {
  body: {
    ...credentials,
    properties: {
      username: { type: 'string', pattern: '^[a-z0-9_]{3,32}$' },
      password: { type: 'string', minLength: 8, maxLength: 128 },
    },
  },
};

export const loginSchema = {
  body: {
    ...credentials,
    properties: {
      username: { type: 'string', minLength: 1, maxLength: 128 },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
};

export interface CredentialsBody {
  username: string;
  password: string;
}

/**
 * Fastify's default ajv coerces types (a number or one-element array would become a string), so
 * strings are checked on the raw body in preValidation, before coercion. Returns true when both are strings.
 */
export const hasStringCredentials = (body: unknown): boolean => {
  const b = body as Partial<Record<keyof CredentialsBody, unknown>> | null | undefined;
  return !!b && typeof b === 'object' && typeof b.username === 'string' && typeof b.password === 'string';
};
