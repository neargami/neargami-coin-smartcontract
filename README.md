# NearGami Coin (NGC)

This project is created by following https://docs.near.org/build/smart-contracts/quickstart

YOU NEED TO CHEKC before anything: https://neargami.com/legal-disclaimer

# Quickstart

1. Make sure you have installed [node.js](https://nodejs.org/en/download/package-manager/) >= 16.
2. Install the [`NEAR CLI`](https://github.com/near/near-cli#setup)

<br />

## 1. Build and Test the Contract
You can automatically compile and test the contract by running:

```bash
npm run build
```

<br />

## 2. Create an Account and Deploy the Contract
You can create a new account and deploy the contract by running:

```bash
near create-account <your-account.testnet> --useFaucet
near deploy <your-account.testnet> build/release/hello_near.wasm
```

<br />


## 3. View and Call methods

`View` methods can be called for **free** by anyone, even people **without a NEAR account**!

```bash
# Use near-cli to get the greeting
near view <your-account.testnet> any_view_method
```

`Call` methods can only be invoked using a NEAR account, since the account needs to pay GAS for the transaction.

```bash
# Use near-cli to set a new greeting
near call <your-account.testnet> any_call_method '{"param1":"howdy"}' --accountId <your-account.testnet>
```

**Tip:** If you would like to call `any_call_method` using another account, first login into NEAR using:

```bash
# Use near-cli to login your NEAR account
near login
```

and then use the logged account to sign the transaction: `--accountId <another-account>`.

# License

MIT
