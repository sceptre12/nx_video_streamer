owner: contracts/grpc-db.md
consumers: db-server-grpc-users-videos, db-users-videos-schema, account-auth, owner-scoped-library-api, range-video-streaming
version: 1
status: proposed delta; the existing messages and rpcs stay owned by protos/src/video/v1/video.proto (measured, facts.md "find protos"); after the sub-task `db-users-videos-schema` merges, that .proto file owns the wire text and this file stays as the pinned description (st1 does not edit contracts/).

# gRPC additions to service DbComService (app-server -> db-server, port 50051)

New messages: `User {string user_id=1; string username=2; string password_hash=3; int64 created_at=4;}` (int64 crosses the JS boundary as a string when the loader option is `longs: String`; st3 confirms the option in apps/app-server/src/app/grpc/index.ts); `CreateUserRequest {string username=1; string password_hash=2;}`; `CreateUserResponse {User user=1;}`; `GetUserByUsernameRequest {string username=1;}`; `GetUserByIdRequest {string user_id=1;}`; `GetUserResponse {optional User user=1;}`; `ListVideosByOwnerRequest {string owner_id=1;}`; `GetVideoForOwnerRequest {string video_id=1; string owner_id=2;}`.
New rpcs:
- `CreateUser(CreateUserRequest{username, password_hash}) returns CreateUserResponse{User user}`; error ALREADY_EXISTS when the username exists.
- `GetUserByUsername(GetUserByUsernameRequest{username}) returns GetUserResponse{optional User user}`
- `GetUserById(GetUserByIdRequest{user_id}) returns GetUserResponse{optional User user}`
- `ListVideosByOwner(ListVideosByOwnerRequest{owner_id}) returns GetVideosResponse` (existing response type)
- `GetVideoForOwner(GetVideoForOwnerRequest{video_id, owner_id}) returns GetVideoResponse`; error NOT_FOUND when missing or owned by another user.
Changed messages (field numbers appended, existing numbers untouched): `VideoItem` gains `optional string owner_id=7; optional string title=8; optional int32 duration_s=9;` `CreateVideoRequest` gains `string owner_id=3;` (CreateVideo answers INVALID_ARGUMENT when `video_id` fails `^[A-Za-z0-9_-]{1,64}$` or owner_id is empty, api-http.md row `POST /api/v1/video/create`) `UpdateVideoStreamingStateRequest` gains `string owner_id=3;` (db-server updates only where the row's owner matches, else NOT_FOUND) `GetVideoResponse` gains the same three fields as `VideoItem` (7, 8, 9).
Existing `GetVideos` (no owner filter) stays but app-server never calls it from a browser-facing route.
