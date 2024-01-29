# nationaal-watersportdiploma

## setting up

Start by generating packages via `make`. This will also tun `pnpm install` so everything is installed and it will run `pnpm --recursive build` for you to build everything.

## testing

Make sure docker is running, then start docker compose from the root of this repo. Then run `pnpm --recursive test` to run all tests.

## docker

we like to use docker as a container for hosting so wel have complete control over the environment. The images used in the container should be the same in ci so we test in a production like environment.

To build the image locally run

```sh
docker build . --file nwd-api-server.dockerfile
```
