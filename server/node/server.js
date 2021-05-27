const express = require("express");
const { resolve } = require("path");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const vision = require("@google-cloud/vision");
const algoliaearch = require("algoliasearch");
const { WebClient } = require('@slack/web-api');

const envFilePath = resolve(__dirname, './.env');
require("dotenv").config({ path: envFilePath });

const app = express();

app.use(express.static(process.env.STATIC_DIR));
app.use(fileUpload());
app.use(bodyParser.json())

app.get("/", (req, res) => {
    const path = resolve(process.env.STATIC_DIR + "/index.html");
    res.sendFile(path);
});

app.post("/scan", async (req, res) => {
    const labelImage = req.files.label;
    let visionClient;
    
    // Setup the Google Cloud client
    // https://cloud.google.com/vision/docs/libraries
    try {
        const googleCredsEnvVar = process.env.GOOGLE_CREDS;
        const creds = JSON.parse(googleCredsEnvVar);
        visionClient = new vision.ImageAnnotatorClient({
            credentials: creds,
        });
    } catch (e) {
        visionClient = new vision.ImageAnnotatorClient();
    }
    
    try {
        // Detect text from the label using Google Cloud Vision
	    // https://cloud.google.com/vision/docs/ocr
        const [result] = await visionClient.textDetection({
            image: {
                content: labelImage.data,
            },
        });
        const detections = result.textAnnotations;
        const labelText = detections[0].description.replace(new RegExp("\n", "g"), " ");

        // Setup the Algolia client
        const algoliaClient = algoliaearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY)
        const index = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME);

        // Search our employees index for a match, using the `removeWordsIfNoResults=allOptional` option.
	    // https://www.algolia.com/doc/api-reference/api-parameters/removeWordsIfNoResults/
        const algoliaResult = await index.search(labelText, {
            'removeWordsIfNoResults': 'allOptional'
        })

        if (algoliaResult.hits.length == 0) {
            throw new Error('Employee not found')
        } else {
            res.send(algoliaResult.hits[0])
        }
    } catch (e) {
        res.status(400);
        return res.send({
            error: e.message
        });
    }
});

app.post("/notify", async (req, res) => {
    const { slackID } = req.body;

    try {
        const slackClient = new WebClient(process.env.SLACK_TOKEN)
        await slackClient.apiCall('chat.postMessage', {
            channel: slackID,
            text: 'A :package: is waiting for you at the front desk!',
            as_user: true,
        });
        res.send({})
    } catch (e) {
        res.status(400);
        return res.send({
            error: e.message
        });
    }
})

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));