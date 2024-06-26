![nwd-signature](https://github.com/buchungapp/nationaal-watersportdiploma/assets/9018689/48b78414-cb7b-414d-b987-b9823eeab1a8)

# Nationaal Watersportdiploma (NWD / NaWaDi)

The Dutch 'Nationaal Watersportdiploma' organization oversees a comprehensive diploma system designed to standardize and enhance the quality and safety of water sports education across the Netherlands. This initiative brings together leading sailing schools and other water sports entities to foster a unified approach to training and certification.

This monorepo includes the source code for our official website and a sophisticated system for tracking and managing diplomas.

## Governance

[BuchungApp](https://www.buchungapp.com/) leads the development efforts on behalf of the Nationaal Watersportdiploma organization. Our commitment extends beyond our team; we actively involve the broader community in shaping the future of this project, as reflected in our decision to maintain this repository publicly. We believe that collective input is crucial for fostering innovation and ensuring the system meets the diverse needs of all stakeholders involved in water sports education.

### Language

Please note that the primary language for communication, documentation, and code comments in this repository is English. This ensures that our global community of contributors can easily participate and collaborate.

### Community & Support

- [GitHub Issues](https://github.com/buchungapp/nationaal-watersportdiploma/issues). Best for: bugs, errors and future requests.
- [Discord](https://discord.gg/tuCtEQZryd). Best for: seeking (development) help and hanging out with the community.

### License

This project is proudly open source, licensed under the GNU Affero General Public License v3.0. While we encourage the free distribution and modification of our work, it's important to note that any derivative work must also be open and available under the same license. For detailed information, please refer to the [LICENSE](https://github.com/buchungapp/nationaal-watersportdiploma/blob/main/LICENSE) file included in this repository.

## Contributing

We encourage contributions from everyone interested in enhancing the quality and reach of water sports education. Whether it's by submitting issues to flag potential improvements or by creating pull requests (PRs) with your proposed changes, your involvement is highly valued.

### Setting up

Start by running `pnpm run initialize`. Do this before installing! This command will generate some dependencies. After this is done you probably wan to run `pnpm install`.

**Everytime you change something in the specifications folder you want to run `pnpm run initialize` to regenerate code!**

### Testing

Before running tests, first start the supabase development environment via `pnpm --filter supabase start`. You need to have [docker](https://docs.docker.com/get-docker/) installed and running for this. Then run `pnpm --recursive test` to run the tests. This assumes that the database can be reached via `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. If this is not the case, set the `PGURI` environment variable.

### Docker

we like to use docker as a container for hosting so we have complete control over the environment. The images used in the container should be the same in ci so we test in a production like environment.

To build the image locally run

```sh
docker build . --file api-server.dockerfile
```

### Releasing

Releasing from this repository is done manually. It works a little different for different projects.

(see https://github.com/buchungapp/nationaal-watersportdiploma/discussions/22)

### API-server

The `nawadi-api-server` service is hosted on render.com via docker. To release it we need docker and installed and running. Also we need docker to be authorized to push to github's docker registry. Also read https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry.

To authorize docker:

```sh
docker login ghcr.io
```

Use your github username as username, create a personal access token and use that as your password.

Build the image

```sh
docker image build --file api-server.dockerfile --tag ghcr.io/buchungapp/nawadi-api-server:latest .
```

Push it

```sh
docker image push ghcr.io/buchungapp/nawadi-api-server:latest
```

Then go to render.com and find the `nawadi-api-server` service, in the `Manual Deploy` dropdown choose `Deploy latest reference`.

### db

The `db` database is hosted on supabase. We use drizzle as an orm and migration tool. To create a database migration we need drizzle-kit, this is installed as a dev dependency. To execute the migration we use drizzle as a library. We use this library from a program.

We are going to use drizzle-kit and the db program via an npm script.

First, you might want to generate migrations scripts. Be sure to check these in into git after they are generated. Generate migration scripts (and metadata) via:

```sh
pnpm --filter db run generate-all
```

In order to run the migration in a production environment you first need to get a connection string to the database server in this environment. Then make sure all of the code is compiled. This is automatically done after and install so you'll probably be fine. Then use the following command, replacing the connection string.

```sh
pnpm --filter db run execute-migration --pg-uri postgres://postgres:postgres@localhost:54322/postgres
```
