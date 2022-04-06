# dbl-functions

## Description

Firebase Cloud Functions for the [DBL Mobile App](https://github.com/Reactotron-2000/dbl-mobile-app).

## Development

1. Install dependencies:

```
yarn install
```

2. Grab the service-account from each project and save it to `./config/development` and `./config/production`:

- [Development](https://console.firebase.google.com/u/0/project/dbl-development/settings/serviceaccounts/adminsdk)
- [pRODUCTION](https://console.firebase.google.com/u/0/project/dbl-production/settings/serviceaccounts/adminsdk)

3. Populate `./config/development/.env.dev` and `./config/production/.env.prod` using `.env.example` as a reference.

4. Run your script, e.g.

```
yarn dev .testing/reserveTickets ...ARGS
```

## Deployment

```
yarn deploy
```

## Publishing

`NOTE`: With each release, the version in [package.json](./package.json) should be updated if the package has changed. This command should be run before each release.`

TODO: SS Create a deployment script to do this on a branch instead, master should always have `1.0.0` in package.json
