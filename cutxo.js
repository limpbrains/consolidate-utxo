const BigNumber = require("bignumber.js");

BN = BigNumber.clone({ DECIMAL_PLACES: 8 });

async function construct({ client, maximumAmount, limit, feeRate }) {
    const { chain } = await client.getBlockchainInfo();

    let unspent = await client.listUnspent(1, 9999999, [], true, {
        maximumAmount,
    });
    const inputsTotal = unspent.length;

    if (unspent.length === 0) {
        throw new Error("No suitable UTXO found");
    }

    if (limit) {
        unspent = unspent.slice(0, limit);
    }

    const address = await client.getNewAddress("");
    console.log("Output address:", address);
    let amount;
    let fee;
    let res;
    let start = 0;
    let end = unspent.length;
    let sliceTo = end;

    console.info("Picking up maximum number of inputs...");
    do {
        console.info(" trying:", sliceTo);
        const unspentSlice = unspent.slice(0, sliceTo);
        const inputs = unspentSlice.map((u) => ({
            txid: u.txid,
            vout: u.vout,
            // sequence: 4294967295 - 1
        }));
        amount = unspentSlice
            .reduce((prev, { amount }) => prev.plus(amount), new BN(0))
            .toNumber();
        const outputs = [{ [address]: amount }];

        try {
            const fR = new BN(feeRate).times(1024).div(1e8).toNumber();
            res = await client.walletCreateFundedPsbt(inputs, outputs, 0, {
                subtractFeeFromOutputs: [0],
                feeRate: fR,
            });
        } catch (e) {
            if (e.message === "Transaction too large") {
                end = sliceTo;
                sliceTo = start + Math.floor((end - start) / 2);
                continue;
            }
            console.error(e);
            throw e;
        }
        fee = res.fee;
        if (sliceTo === end || end - start <= 1) {
            break;
            console.log(" success");
        }
        start = sliceTo;
        sliceTo = start + Math.floor((end - start) / 2);
    } while (true);

    console.log("Signing transaction...");
    res = await client.walletProcessPsbt(res.psbt);
    if (!res.complete) {
        throw new Error("Error during walletprocesspsbt");
    }

    console.log("Finalizing transaction...");
    res = await client.finalizePsbt(res.psbt);
    if (!res.complete) {
        throw new Error("Error during finalizePsbt");
    }

    console.log("Transaction created");

    return {
        address,
        amount,
        fee,
        hex: res.hex,
        inputsUsed: sliceTo,
        inputsTotal,
    };
}

async function broadcast({ client, hex }) {
    console.log("Broadcasting transaction...");
    const txid = await client.sendRawTransaction(hex);
    console.log("Done!");
    return txid;
}

module.exports = {
    construct,
    broadcast,
};
