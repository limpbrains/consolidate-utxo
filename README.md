# consolidate-utxo
Tool which helps consolidate your unspent transactions outputs

![test status](https://github.com/limpbrains/consolidate-utxo/workflows/Regtest%20test/badge.svg)

When you have a long-running bitcoin wallet with big transaction history, you might start getting errors like `Transaction too large` during the withdrawal. That's because you have a lot small UTXOs (Unspent transaction outputs) and when bitcoin node tries to build transaction it became too large. To fix this you need to Consolidate your UTXO set.

*Designed for Bitcoin version >= 0.17*

## How it works

consolidate-utxo asks all unspent outputs from your bitcoin node, filters them by amount (`0.0001` by default) and tries to build a transaction to send them all back to the node in one output. If the resulting transaction is too big, it will lower number of inputs and try again.

## How to install

This program is written in JavaScript and to run in you need NodeJS to be installed on your system.

To install it globally run

```bash
npm install -g consolidate-utxo
```

Or you can create temporary project to install it locally

```bash
mkdir tmpprj
cd tmpprj
npm init
npm install consolidate-utxo
```

If you have installed it locally, you need to run it using npx

```bash
npx consolidate-utxo
```

## How to use

consolidate-utxo tool needs RPC server to be enabled in your bitcoin.conf and rpc username and password to be set.

bitcoin.conf example:
```
server=1
rpcuser=root
rpcpassword=toor
```

Then you can run
```bash
consolidate-utxo --username root --password toor
```

Default transaction fee is set to the lowest possible value - 1 sat/byte. So before broadcasting transaction make sure mempool is empty and it can be confirmed in a reasonable amount of time. You can change fee by `--fee` parameter. 

Other options:

```bash
~ consolidate-utxo --help

Consolidates UTXO on your bitcoin node.

    cutxo --username root --password toor --amount 0.0001 --fee 2

  --help     Show help.
  --host     Host to connect to. Default is "localhost".
  --port     Port where bitcoin json-rpc is listerning. Default is "8332".
  --limit    Limit number of inputs.
  --amount   Maximum amount for UTXO to include in transaction. Default is "0.0001".
  --fee      Fee for new transaction in Satoshi/byte. Default is "1".
```

## Testing

To run tests you need to run bitcoin node in regtest mode and then run application tests

```bash
docker-compose up -d
npm test
```

## Example

Here is example of running consolidate-utxo against node with 4000 UTXOs on testnet:

```bash
$ consolidate-utxo --username root --password toor --amount 0.001 --port 18332
Output address: 2MyrmzDNT7Xe8QqYwWQtQFsB73TeYg1Q3jm
Picking up maximum number of inputs...
 trying: 4775
 trying: 2387
 trying: 3581
 trying: 2984
 trying: 2685
 trying: 2536
 trying: 2461
 trying: 2424
 trying: 2442
 trying: 2433
 trying: 2437
 trying: 2439
 trying: 2438
 trying: 2437
 success
Signing transaction...
Finalizing transaction...
Transaction created

Number of inputs: 2437
Inputs total amount: 2.437
Output amount: 2.43473489
Fee: 0.00226511
Output address: 2MyrmzDNT7Xe8QqYwWQtQFsB73TeYg1Q3jm

Are you sure you want to broadcast the transaction? yes
Broadcasting transaction...
Done!
b4a568966f3b7f981ad2f98c12adead32066f69a816c390218597dfc096cf99f
```

You can check resulting transaction on [blockchain explorer](https://blockstream.info/testnet/tx/b4a568966f3b7f981ad2f98c12adead32066f69a816c390218597dfc096cf99f)

## Altcoins

This script probably should work with Litecoin 0.17, since it has PSBT support but I didn't test it.

## License

MIT
