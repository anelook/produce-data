import Kafka from "node-rdkafka";

import dotenv from "dotenv"
import csvParser from 'csv-parser';
import * as fs from "fs";
dotenv.config();

//create a producer
const producer = new Kafka.Producer({
    'metadata.broker.list': process.env["kafka.uri"],
    'security.protocol': 'ssl',
    'ssl.key.location': process.env["ssl.key.location"],
    'ssl.certificate.location': process.env["ssl.certificate.location"],
    'ssl.ca.location': process.env["ssl.ca.location"],
    'dr_cb': true
});

producer.on('event.log', function (log) {
    console.log(log);
});

//logging all errors
producer.on('event.error', function (err) {
    console.error(err);
});

producer.on('connection.failure', function (err) {
    console.error(err);
});

producer.on('delivery-report', function (err, report) {
    console.log('Message was delivered' + JSON.stringify(report));
});

producer.on('disconnected', function (arg) {
    console.log('producer disconnected. ' + JSON.stringify(arg));
});

let messageCount = 0;
producer.on('ready', async () => {
    // Read CSV and send each row as a JSON object
    fs.createReadStream('./reviews.csv')
        .pipe(csvParser())
        .on('data', (row) => {
            // Skip the header row
            if (row.Id !== 'Id') {
                const jsonRow = {
                    Id: row.Id,
                    ProductId: row.ProductId,
                    UserId: row.UserId,
                    ProfileName: row.ProfileName,
                    HelpfulnessNumerator: row.HelpfulnessNumerator,
                    HelpfulnessDenominator: row.HelpfulnessDenominator,
                    Score: row.Score,
                    Time: row.Time,
                    Summary: row.Summary,
                    Text: row.Text
                };

                const jsonString = JSON.stringify(jsonRow);

                producer.produce(
                    'reviews',  // Name of the topic
                    null,        // Partition, use null for librdkafka default partitioner
                    Buffer.from(jsonString),  // Message to send
                    null,        // Optional key
                    Date.now()   // Optional timestamp
                );

                messageCount++;

                // Flush after every 100 messages
                if (messageCount % 100 === 0) {
                    producer.flush(2000);
                    console.log(`Flushing producer after ${messageCount} messages.`);
                }
            }
        })
        .on('end', () => {
            // Flush and disconnect after processing all rows
            producer.flush(2000);
            producer.disconnect();
            console.log("Messages sent");
        });
});

producer.connect({}, (err) => {
    if (err) {
        console.error(err);
    }
});