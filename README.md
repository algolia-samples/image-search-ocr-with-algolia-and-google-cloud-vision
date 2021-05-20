# Delivery scanner with Algolia and Google Cloud Vision

This sample shows you how to implement a delivery "scanner" using Algolia, [Google Cloud Vision](https://cloud.google.com/vision).

![A flowchart of the delivery scanner sample](https://blog-api.algolia.com/wp-content/uploads/2019/05/diagram-algo-package.jpg)

You can read more about the story and the problem we were trying to solve on the [Algolia blog](https://www.algolia.com/blog/engineering/simplifying-parcel-delivery-algolia/).

## Features
- 📱📷  Detect and extract text from an image with [Google Cloud Vision](https://cloud.google.com/vision).
- 🔎  Quickly match a record from a search query with a lot of "noise" with [Algolia `removeWordsIfNoResults` parameter](https://www.algolia.com/doc/api-reference/api-parameters/removeWordsIfNoResults/).
- 💌📦  Notify people using [Slack bots](https://slack.com/help/articles/115005265703-Create-a-bot-for-your-workspace).

## Demo

<img src="demo/demo.gif?raw=true" alt="A short movie displaying the Algolia delivery scanner application" align="center">

1. Flash this QR Code with your mobile phone to access the demo👇

<details>
  <summary>QR Code</summary>
  <img src="demo/qr_code.png?raw=true" alt="A QR Code to access the Algolia delivery scanner application" align="center">
</details>

2. Scan the delivery👇

<details>
  <summary>Delivery picture</summary>
  <img src="demo/parcel-label.jpg?raw=true" alt="A picture of a parcel" align="center">
</details>

## How to run locally

This sample includes 3 server implementations in [Python](server/python), [JavaScript (Node)](server/node), [Go](server/go).

The [client](client) is a single HTML page with some Vanilla Javascript.

**1. Clone and configure the sample**

```
git clone https://github.com/algolia-samples/delivery-scanner
```

Copy the .env.example file into a file named .env in the folder of the server you want to use. For example:

```
cp .env.example server/go/.env
```

You will need an Algolia account in order to run the demo. If you don't have already an account, you can [create one for free](https://www.algolia.com/users/sign_up).

```bash
ALGOLIA_APP_ID=<replace-with-your-algolia-app-id>
ALGOLIA_API_KEY=<replace-with-your-algolia-api-key>
```

**2. Create and populate your Algolia index**

Once your Algolia account and your Algolia application are setup, you will need to [create and populate an index](https://www.algolia.com/doc/guides/sending-and-managing-data/prepare-your-data/).

The application is expecting your index records to have the following shape:
```json
{
    "displayName": "Jane Doe",
    "slack": {
        "id": "U01GC09PJEN",
        "image": "https://thispersondoesnotexist.com/image"
    }
}
```

You can either upload your data directly from the [Algolia dashboard](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/importing-from-the-dashboard/) or by using one of our [API clients](https://www.algolia.com/developers/#integrations).

Once your index is populated, you can now fill the last Algolia-related environment variable:

```bash
ALGOLIA_INDEX_NAME=<replace-with-your-algolia-index-name>
```

**3. Google Cloud Vision and Slack**

Follow the intructions at the [Google Cloud Vision documentation](https://cloud.google.com/vision/docs/ocr) and fill the related environment variable:

```bash
GOOGLE_APPLICATION_CREDENTIALS=<replace-with-the-path-of-your-credentials-file>
```

[Create a Slack application](https://slack.com/help/articles/115005265703-Create-a-bot-for-your-workspace) and fill the environment variable:

```bash
SLACK_TOKEN=<replace-with-the-slack-bot-token>
```

**4. Follow the server instructions on how to run**

Pick the server language you want and follow the instructions in the server folder README on how to run.

For example, if you want to run the Python server:

```
cd server/python # there's a README in this folder with instructions
python3 venv env
source env/bin/activate
pip3 install -r requirements.txt
export FLASK_APP=server.py
python3 -m flask run --port=4242
```

## Authors
- [@cdenoix](https://twitter.com/cdenoix)