# Welcome to the nx video streamer.

I created this project as a way to learn several technoligies on a small scale.

- Nx
- Module Federation
- Grpc
- Superbase (to an extent)


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


To set up superbase with this project.
1. create an .env file in the db-server project
2. Create a superbase account
3. Follow Step 1 from this [guide] (https://supabase.com/partners/integrations/prisma)

In your .env file create this:
```
DATABASE_URL="" # Set this to the Transaction connection pooler string you copied in Step 1
DIRECT_URL=""  # Set this to the Session connection pooler string you copied in Step 1
```

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


### [SuperBase](https://supabase.com/) open source alternative for firebase but using postgress. 

I'm using this tool to store meta data for the work I'm doing. Nothing major here. 
