# nationaal-watersportdiploma

## setting up

Just run `npm install` from the root folder and you're good to go!

## regenerating code

Some code in this repositry is generated. Please don't touch it! If you want to regenerate the
code, simple run `make` form the root of this repository.

## testing

Make sure docker is running, then start docker compose from the root of this repo. Then do your testing!

## docker

we like to use docker as a container for hosting so wel have complete control over the environment. The images used in the container should be the same in ci so we test in a production like environment.

To build the image locally run

```sh
docker build . --file nwd-api-server.dockerfile
```
