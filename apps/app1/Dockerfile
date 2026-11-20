# ui image: nginx serving the built app1 and proxying /api and /socket.io.
# Prerequisite: `npx nx build app1` has produced dist/apps/app1 in the build
# context (the build stage cannot install dependencies without network).
FROM nginx:alpine
COPY apps/app1/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/apps/app1 /usr/share/nginx/html
# container port only; no host port is published here
EXPOSE 8080
