import { randomBytes } from 'crypto';
import { startDbServer, startPostgres, DbServerChild, ThrowawayPostgres } from '../test-support';
import type { ErrorResponseParam } from '../../routes/utils/errorHandler';

/*
 * Wrappers against the built db-server (npx nx build db-server first) over a throwaway postgres.
 * Needs a reachable docker daemon. Passwords and JWT_SECRET are generated here, never literals.
 */
jest.setTimeout(240000);

type Wrappers = typeof import('./index');

let pg: ThrowawayPostgres;
let child: DbServerChild;
let w: Wrappers;

const errors = () => {
  const seen: ErrorResponseParam[] = [];
  return { seen, errorHandler: (e: ErrorResponseParam) => void seen.push(e) };
};
const rand = (p: string) => `${p}-${randomBytes(4).toString('hex')}`;

async function makeUser(username = rand('user'), password_hash = randomBytes(16).toString('hex')) {
  const e = errors();
  const user = await w.createUser({ requestObject: { username, password_hash }, callBack: () => undefined, errorHandler: e.errorHandler });
  expect(e.seen).toEqual([]);
  return { user: user!, username, password_hash };
}

async function makeVideo(owner_id: string, video_id = rand('vid')) {
  const e = errors();
  const res = await w.createVideo({ requestObject: { video_id, start_time: 1000, owner_id }, callBack: () => undefined, errorHandler: e.errorHandler });
  expect(e.seen).toEqual([]);
  return { video_id, res: res! };
}

beforeAll(async () => {
  pg = await startPostgres('app-server-grpc-spec');
  child = await startDbServer({ DATABASE_URL: pg.url, DIRECT_URL: pg.url });
  // the client reads DB_GRPC_ADDR when its module loads, so import after the child is up
  process.env.DB_GRPC_ADDR = child.grpcAddr;
  w = await import('./index');
});

afterAll(async () => {
  await child?.stop();
  pg?.stop();
});

describe('users and videos grpc client wrappers', () => {
  it('createUser, getUserByUsername and getUserById return the db-server user', async () => {
    const { user, username, password_hash } = await makeUser();
    expect(user.username).toBe(username);
    const byName = await w.getUserByUsername({ requestObject: { username }, callBack: () => undefined, errorHandler: errors().errorHandler });
    const byId = await w.getUserById({ requestObject: { user_id: user.user_id }, callBack: () => undefined, errorHandler: errors().errorHandler });
    expect(byName).toEqual(user);
    expect(byId).toEqual(user);
    expect(byId?.password_hash).toBe(password_hash);
  });

  it('getUserByUsername and getUserById resolve null for an unknown user', async () => {
    const e = errors();
    expect(await w.getUserByUsername({ requestObject: { username: rand('nobody') }, callBack: () => undefined, errorHandler: e.errorHandler })).toBeNull();
    expect(await w.getUserById({ requestObject: { user_id: '00000000-0000-0000-0000-000000000000' }, callBack: () => undefined, errorHandler: e.errorHandler })).toBeNull();
    expect(e.seen).toEqual([]);
  });

  it('createUser reports ALREADY_EXISTS as code 409 for a duplicate username', async () => {
    const { username } = await makeUser();
    const e = errors();
    const again = await w.createUser({ requestObject: { username, password_hash: 'x' }, callBack: () => undefined, errorHandler: e.errorHandler });
    expect(again).toBeNull();
    expect(e.seen).toHaveLength(1);
    expect(e.seen[0].code).toBe(409);
  });

  it('listVideosByOwner and getVideoForOwner return only the owner\'s videos', async () => {
    const a = (await makeUser()).user;
    const b = (await makeUser()).user;
    const { video_id } = await makeVideo(a.user_id);
    await makeVideo(b.user_id);

    const list = await w.listVideosByOwner({ requestObject: { owner_id: a.user_id }, callBack: () => undefined, errorHandler: errors().errorHandler });
    expect(list?.map((v) => v.video_id)).toEqual([video_id]);
    expect(list?.[0].owner_id).toBe(a.user_id);

    const one = await w.getVideoForOwner({ requestObject: { video_id, owner_id: a.user_id }, callBack: () => undefined, errorHandler: errors().errorHandler });
    expect(one?.video_id).toBe(video_id);

    const e = errors();
    const other = await w.getVideoForOwner({ requestObject: { video_id, owner_id: b.user_id }, callBack: () => undefined, errorHandler: e.errorHandler });
    expect(other).toBeNull();
    expect(e.seen[0].code).toBe(404);
  });

  it('createVideo and updateVideoStreamingState send owner_id', async () => {
    const a = (await makeUser()).user;
    const b = (await makeUser()).user;
    const { video_id } = await makeVideo(a.user_id);

    const ok = errors();
    const updated = await w.updateVideoStreamingState({ requestObject: { video_id, has_streaming_started: true, owner_id: a.user_id }, callBack: () => undefined, errorHandler: ok.errorHandler });
    expect(ok.seen).toEqual([]);
    expect(updated).toEqual({ update_complete: true });

    // a different owner matches no row: NOT_FOUND
    const bad = errors();
    await w.updateVideoStreamingState({ requestObject: { video_id, has_streaming_started: false, owner_id: b.user_id }, callBack: () => undefined, errorHandler: bad.errorHandler });
    expect(bad.seen[0]?.code).toBe(404);

    // an empty owner_id is rejected by CreateVideo: INVALID_ARGUMENT
    const empty = errors();
    await w.createVideo({ requestObject: { video_id: rand('vid'), start_time: 1, owner_id: '' }, callBack: () => undefined, errorHandler: empty.errorHandler });
    expect(empty.seen[0]?.code).toBe(400);
  });

  it('casing: runtime objects are snake_case with the sent values and carry no camelCase key', async () => {
    const { user, username, password_hash } = await makeUser();
    const got = await w.getUserById({ requestObject: { user_id: user.user_id }, callBack: () => undefined, errorHandler: errors().errorHandler });
    const u = got as unknown as Record<string, unknown>;
    expect(typeof u.user_id).toBe('string');
    expect(u.user_id).not.toBe('');
    expect(u.username).toBe(username);
    expect(u.password_hash).toBe(password_hash);
    expect(typeof u.created_at).toBe('string');
    for (const k of ['userId', 'passwordHash', 'createdAt']) expect(u[k]).toBeUndefined();

    const { res } = await makeVideo(user.user_id);
    const v = res.results as unknown as Record<string, unknown>;
    expect(v.owner_id).toBe(user.user_id);
    expect(typeof v.video_id).toBe('string');
    for (const k of ['ownerId', 'videoId', 'startTime', 'isStreaming']) expect(v[k]).toBeUndefined();
  });
});
