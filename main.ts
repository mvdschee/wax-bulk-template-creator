import { consola } from "consola";
import { config } from "dotenv";
import { Api, JsonRpc } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";

// this is the file it will read from
import template from "./template.json";
import { Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { Action } from "eosjs/dist/eosjs-serialize";

// load env
config();

if (process.env.CHAIN_URL === undefined) {
    consola.error("Did you forget to add the .env file?");
    process.exit(1);
}

// setup RPC
const RPC = new JsonRpc(process.env.CHAIN_URL);
const signatureProvider = new JsSignatureProvider([process.env.PRIVATE_KEY as string]);
const RPC_API = new Api({
    rpc: RPC,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
});

const createActions = (chunks: any[]) => {
    const actions: Action[] = [];

    for (let i = 0; i < chunks.length; i++) {
        // change this to your needs
        const { name, img, message } = chunks[i];

        const action: Action = {
            account: "atomicassets",
            name: "createtempl",
            authorization: [
                {
                    actor: process.env.WAX_ACCOUNT as string,
                    permission: process.env.WAX_PERMISSION as string,
                },
            ],
            data: {
                authorized_creator: process.env.WAX_ACCOUNT,
                collection_name: process.env.COLLECTION_NAME,
                schema_name: process.env.SCHEMA_NAME,
                // allow the nft to be transfered
                transferable: true,
                // allow the nft to be burned
                burnable: true,
                // supply of the nft is unlimited
                // if you need it to be 1 of 1, set this to 1
                max_supply: 0,
                immutable_data: [
                    {
                        key: "name",
                        value: ["string", name],
                    },
                    {
                        key: "img",
                        value: ["string", img],
                    },
                    {
                        key: "message",
                        value: ["uint64", message],
                    },
                ],
            },
        };

        actions.push(action);
    }

    return actions;
};

const main = async () => {
    const chunksize = 25;

    // cut the file into chunks
    const chunks = template.reduce((resultArray: any, item: any, index: any) => {
        const chunkIndex = Math.floor(index / chunksize);

        if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];

        resultArray[chunkIndex].push(item);

        return resultArray;
    }, []);

    consola.success(`${chunks.length} chunks created`);

    for (let i = 0; i < chunks.length; i++) {
        consola.start(`Creating transaction ${i + 1} of ${chunks.length}...`);
        const actions = createActions(chunks[i]);
        consola.success(`Transaction ${i + 1} of ${chunks.length} created`);

        const transaction: Transaction = {
            actions,
        };

        try {
            const transactionResult = await RPC_API.transact(transaction, {
                blocksBehind: 3,
                expireSeconds: 120,
                broadcast: true,
            });

            if (!transactionResult?.transaction_id) {
                consola.error("failed at transaction", i + 1);

                if (transactionResult?.processed?.error) {
                    consola.error(transactionResult.processed.error);
                }

                return;
            }

            consola.success(`Transaction ${i + 1} of ${chunks.length} broadcasted`);
            consola.info(`https://waxblock.io/transaction/${transactionResult.transaction_id}`);

            await new Promise((resolve) => setTimeout(resolve, 1000));

            consola.info(`Transaction status: ${transactionResult.processed.receipt.status}`);
        } catch (error) {
            consola.error(error);
            consola.error("failed at transaction", i + 1);
        } finally {
            // wait 10 seconds for the next transaction
            consola.info("Waiting 10 seconds for the next transaction...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }
};

main();
