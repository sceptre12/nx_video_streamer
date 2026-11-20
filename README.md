# Welcome to the nx video streamer.

I created this project as a way to learn several technoligies on a small scale.

- Nx
- Module Federation
- Grpc
- Postgres and Redis (in containers)


## To get up and running
-- Ensure you're using the correct version of node by:
```
 n auto or nvm use (depends on what node version manager you're using)
```

If you aren't using a node version manager (you should) then check the .node-version file to find the supported node version

Then execute npm install. 


To run any of the applications under apps execute:

```
nx run [project name]:serve
```

The current process that are setup are:
- app-server
- app1
- db-server


## Run the containerised stack

The stack runs under Docker Compose with these services: `ui` (nginx serving the built app1 and proxying `/api` to app-server and `/socket.io` to db-server), `app-server`, `db-server`, `postgres`, `redis`, and `seed` (a one-shot service that loads the demo accounts and videos, then exits).

1. Generate the git-ignored `.env` file (never committed):

```
bash scripts/stack-env.sh
```

It writes random values for `JWT_SECRET`, `POSTGRES_PASSWORD`, `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD`. Do not copy these values into any tracked file.

2. Build app1 on the host first, because the ui image copies the git-ignored `dist/apps/app1`:

```
npx nx build app1
```

3. Start the stack:

```
docker compose up --build
```

4. Open http://localhost:36000. This is the only port published to the host (`UI_HOST_PORT`, default 36000); the other services are reachable only on the compose network.

Demo accounts: the usernames are `demo1` and `demo2`. Their passwords are the values of `DEMO_USER1_PASSWORD` and `DEMO_USER2_PASSWORD` in your generated `.env`.

Postgres runs as the `postgres` container; `DATABASE_URL` and `DIRECT_URL` are set to the same value in compose.

## Major Technologies I'm focused on 


### [NX](https://nx.dev/) is a monorepo management tool.
- This tool can be used to help generate new projects, cache project builds, create an affected graph that maps out the relationship between each project. It can also be used within a CI environment with nx cloud. 

I'm using this tool to help speed up project setup. 
The majority of the commands I use within this work space are called by directly executing:

```
nx run [project name]:[project targets]
```

### [Module Federation](https://module-federation.io/) is a micro-frontend architectural pattern for decentralizing JS applications.
- Think micro-services on the server-side but now on the client. 

I'm using this tool as a way to test out the effects of stitching two apps that are built separately, together on one UI.
I'm interested in seeing what issues may arise from having different versions of an app and even what happens when there are libraries that are shared between the two apps.



### [Grpc](https://grpc.io/) is a modern open source high performance Remote Procedure Call framework
- This tool can be used to execute commands on any environment and can stream commands between servers. 

I'm using this tool to send instructions between my App server and the Db server. 


### [Postgres](https://www.postgresql.org/) and [Redis](https://redis.io/)

I'm using Postgres to store meta data for the work I'm doing, and Redis as a cache. Both run as containers in the compose stack. Nothing major here.
