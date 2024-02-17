# Nationaal-Watersportdiploma

## Setting up

Start by generating packages via `make`. This will also tun `pnpm install` so everything is installed and it will run `pnpm --recursive build` for you to build everything.

## testing

Make sure docker is running, then start docker compose from the root of this repo. Then run `pnpm --recursive test` to run all tests.

## docker

we like to use docker as a container for hosting so wel have complete control over the environment. The images used in the container should be the same in ci so we test in a production like environment.

To build the image locally run

```sh
docker build . --file nwd-api-server.dockerfile
```

## Releasing

Releasing from this repository is done manually. It works a little different for different projects.

(see https://github.com/buchungapp/nationaal-watersportdiploma/discussions/22)

### nwd-api-server

The `nwd-api-server` service is hosted on render.com via docker. To release it we need docker and installed and running. Also we need docker to be authorized to push to github's docker registry. Also read https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry.

To authorize docker:

```sh
docker login ghcr.io
```

Use your github username as username, create a personal access token and use that as your password.

Build the image

```sh
docker image build --file nwd-api-server.dockerfile --tag ghcr.io/buchungapp/nwd-api-server:latest .
```

Push it

```sh
docker image push ghcr.io/buchungapp/nwd-api-server:latest
```

Then go to render.com and find the `nwd-api-server` service, in the `Manual Deploy` dropdown choose `Deploy latest reference`.

### nwd-db

The `nwd-db` database is hosted on supabase. We use drizzle as an orm and migration tool. To create a database migration we need drizzle-kit, this is installed as a dev dependency. To execute the migration we use drizzle as a library. We use this library from a program.

We are going to use drizzle-kit and the nwd-db program via an npm script.

First, you might want to generate migrations scripts. Be sure to check these in into git after they are generated. Generate migration scripts (and metadata) via:

```sh
pnpm --filter nwd-db run generate-migration
```

In order to run the migration in a production environment you first need to get a connection string to the database server in this environment. Then make sure all of the code is compiled. This is automatically done after and install so you'll probably be fine. Then use the following command, replacing the connection string.

```sh
pnpm --filter nwd-db run execute-migration --pg-uri postgres://postgres:postgres@localhost:5432/postgres
```
