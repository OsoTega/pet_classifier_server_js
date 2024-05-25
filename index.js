/*
Author: Tega Osowa
Email: stevetega.osowa11@gmail.com
GitHub: OsoTega
Description: This is a server that process image data from the frontend, and sends it to the python
server for classification
License: Opensource and free to use
*/

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-node';
import express from 'express'
import path, { dirname } from "path";
import cors from 'cors'
import bodyParser from 'body-parser';
import fs from 'fs'
import { configDotenv } from 'dotenv';

const app = express()
configDotenv();

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));

//Post method to receive image array from the frontend

app.post('/classify', async (req, res) => {

    console.log("Received request");

    const data = req.body.data;

    const floatData = new Float32Array(data);

    //using the tensorflow library to covert  the array into the specified shape for prediction
    //1 is the batch size of the image, 224, 224, are the dimensions width and height
    // 3 is the number of channels

    const imageTensor = tf.tensor4d(floatData, [1, 224, 224, 3]);
    const arrayTensor = imageTensor.arraySync();

    console.log("Sending request");
    //Sending the data to the python flask server for prediction
    fetch(process.env.SERVER_URL, {
        method: 'POST',
        body: JSON.stringify({ data: arrayTensor }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    }).then(async (response) => {
        console.log("Received response");
        const data = await response.json()
        const label = data.message[0][0];

        if (label >= 0.5) {
            const probability = ((label - 0.5) / 0.5) * 100
            res.send(JSON.stringify({
                classification: 'Dog',
                probability
            }))
        } else {
            const probability = ((0.5 - label) / 0.5) * 100
            res.send(JSON.stringify({
                classification: 'Cat',
                probability
            }))
        }
    })
})

app.listen(8080);