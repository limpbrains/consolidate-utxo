/* eslint-env jest */
const Client = require("bitcoin-core");

const { construct, broadcast } = require("./cutxo");

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

describe("Trades", () => {
    const client = new Client({
        port: 43782,
        username: "root",
        password: "toor",
    });
    beforeEach(async () => {
        // wait till the wallet is ready
        while (true) {
            try {
                await client.ping();
            } catch (e) {
                if (e.code === -28) {
                    await sleep(1000);
                    continue;
                }
                throw e;
            }
            break;
        }
        await client.generate(110);
    });

    it("empty unspent", async () => {
        expect(construct({ client, maximumAmount: 0.001, feeRate: 1 })).rejects.toThrow(
            "No suitable UTXO found"
        );
    });

    it("3 to one", async () => {
        const send = {};
        for (let type of ["legacy", "p2sh-segwit", "bech32"]) {
            const address = await client.getNewAddress("", type);
            send[address] = 0.001;
        }

        await client.sendMany("", send);
        await client.generate(1);

        tx = await construct({ client, maximumAmount: 0.001, feeRate: 1 });
        expect(tx.amount).toBe(0.003);
        expect(typeof tx.address).toBe("string");
        expect(tx.fee).toBeLessThan(0.001);
        expect(typeof tx.hex).toBe("string");
        expect(tx.inputsTotal).toBe(3);
        expect(tx.inputsUsed).toBe(3);

        const txid = await broadcast({ client, hex: tx.hex });
        expect(typeof txid).toBe("string");

        // console.info('tx.hex')
        // console.info(tx.hex)

        await client.generate(1);

        const unspent = await client.listUnspent(1, 9999999, [], true, {
            maximumAmount: 0.001,
        });
        expect(unspent).toHaveLength(0);
    });

    it("3000 inputs", async () => {
        let send = {};
        for (let i of [...Array(3000)].map((_, i) => i + 1)) {
            const address = await client.getNewAddress();
            send[address] = 0.001;
            if (i % 500 === 0) {
                await client.sendMany("", send);
                send = {};
            }
        }
        await client.generate(1);

        // first transaction
        const tx = await construct({ client, maximumAmount: 0.001, feeRate: 1 });
        expect(tx.amount).toBeGreaterThan(2);
        expect(tx.amount).toBeLessThan(3);
        expect(typeof tx.address).toBe("string");
        expect(typeof tx.fee).toBe("number");
        expect(typeof tx.hex).toBe("string");
        expect(tx.inputsTotal).toBe(3000);
        expect(tx.inputsUsed).toBeGreaterThan(2000);
        expect(tx.inputsUsed).toBeLessThan(3000);

        const txid = await broadcast({ client, hex: tx.hex });
        expect(typeof txid).toBe("string");

        // second transaction
        const tx2 = await construct({ client, maximumAmount: 0.001, feeRate: 1 });
        const txid2 = await broadcast({ client, hex: tx2.hex });

        await client.generate(1);
        // after secod tx unspent should be 0
        const unspent = await client.listUnspent(1, 9999999, [], true, {
            maximumAmount: 0.001,
        });
        expect(unspent).toHaveLength(0);
    });
});
