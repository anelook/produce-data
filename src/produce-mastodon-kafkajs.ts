import * as fs from "fs";

const {Kafka} = require('kafkajs')
import mastostream from "./mastostream";
import dotenv from "dotenv"
import path from "path";

dotenv.config();

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env["kafka.uri"]],
    ssl: {
        ca: [fs.readFileSync(path.resolve(__dirname, process.env["ssl.ca.location"] || ''))],
        key: fs.readFileSync(path.resolve(__dirname, process.env["ssl.key.location"] || '')),
        cert: fs.readFileSync(path.resolve(__dirname, process.env["ssl.certificate.location"] || ''))
    },
})

const producer = kafka.producer()

const run = async () => {
    await producer.connect()
    mastostream(async (status) => {
        await producer.send({
            topic: 'mastodon_posts',
            messages: [
                {
                    value: status
                },
            ],
        })
        console.log("Message sent");
    }).catch((error) => {
        throw error;
    });
}

run().catch(console.error)