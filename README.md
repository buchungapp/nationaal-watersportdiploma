# nationaal-watersportdiploma

## setting up

Start by generating packages via `make`. This will also tun `pnpm install` so everything is installed. Then run `pnpm --recursive build` to build everything.

## regenerating code

Some code in this repository is generated. Please don't touch it! If you want to regenerate the
code, simple run `make` form the root of this repository.

## testing

Make sure docker is running, then start docker compose from the root of this repo. Then run `pnpm --recursive test` to run all tests.

## docker

we like to use docker as a container for hosting so wel have complete control over the environment. The images used in the container should be the same in ci so we test in a production like environment.

To build the image locally run

```sh
docker build . --file nwd-api-server.dockerfile
```
