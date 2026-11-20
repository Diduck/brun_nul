# How to run
There are 2 ways to run this project :
Both have these requirements :
- Docker
- Internet access

## Run it for testing

Create a .env file at the root of the project folder with a content like this : **Replace the port number by the chosen port number to access the app**.

```
DEV_PORT=8081
```
Then run :
```bash
docker compose -f dev-compose.yml up -d --build
```
## Run it for production

Requirement :

Create a .env file at the root of the project folder with a content like this : **Replace the port number by the chosen port number to access the app**.

```
PROD_PORT=8080
```

Then run :
```bash
docker compose -f prod-compose.yml up -d --build
```

# VM setup

The VM where the runner runs has been setup with docker rootless. It is not possible to bind prots under 1024 with the runner.

The github runner has been installed on the user "valentin" in `/home/valentin/`