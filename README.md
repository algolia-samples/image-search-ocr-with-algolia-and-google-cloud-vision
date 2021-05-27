# Image search with optical character recognition, Algolia and Slack notifications

This sample app lets you scan a shipping label with your phone and sends a Slack message to the recipient of the package. The app combines optical character recognition (OCR), Algolia search, and Slack notifications. 

![A flowchart of the delivery scanner sample](https://blog-api.algolia.com/wp-content/uploads/2019/05/diagram-algo-package.jpg)

Read more about how we use this app at Algolia on the [Algolia blog](https://www.algolia.com/blog/engineering/simplifying-parcel-delivery-algolia/).

## Features

The sample app uses the following features:

### 📱📷 Detect and extract text from an image with [Google Cloud Vision](https://cloud.google.com/vision).

Depending on the quality of the scan, the Google Cloud Vision API might return a response like this: 
   
```
{
  "textAnnotations" : [
    {
      "description": "ORY1\n0.7 KG\nDENOIX Clément\nALGOLIA\n55 rue d'Amsterdam\n75008 Paris, France\nC20199352333\nDIF4\nCYCLE\nlove of boo\nAnod",
      ...
    },
    ...
  ],
  ...
}
```

The extracted text isn't "clean" and contains extra characters. You could try to write your own logic to extract the person first name / last name from the extracted text, or you can leave this part to Algolia!

### 🔎 Remove "noise" from a search query and find matching results with Algolia.

With the [`removeWordsIfNoResults`](https://www.algolia.com/doc/api-reference/api-parameters/removeWordsIfNoResults/) parameter set to `allOptional`, Algolia treats all words in the search query as optional. To make it easier for Algolia to recognize the individual words, we replace all newline characters with spaces and perform the following query:
  
```
{
  query: "ORY1 0.7 KG DENOIX Clément ALGOLIA 55 rue d'Amsterdam 75008 Paris, France C20199352333 DIF4 CYCLE love of boo Anod",
  removeWordsifNoResults: "allOptional",
  ...
}
```
  
If Algolia finds the name in the index, it returns the corresponding Slack ID:
  
```
{
  hits: [
    {
      "displayName": "Clément Denoix",
      "slackID": "<SLACK_HANDLE>"
    }
  ]
}
```
   
### 💌📦 Notify people using [Slack bots](https://slack.com/help/articles/115005265703-Create-a-bot-for-your-workspace).

The Slack bot sends a message: "A :package: is waiting for you at the front desk!".

## Demo (Try it yourself!)

This short clip demonstrates how to use the sample app:

<img src="demo/demo.gif?raw=true" alt="A short video clip displaying the Algolia delivery scanner application" align="center">

Follow these steps to use the demo app with a sample index.

1. Scan this QR code with your phone to open the demo app👇

<details>
  <summary>QR code</summary>
  <img src="demo/qr_code.png?raw=true" alt="A QR code to access the Algolia shipping label scanner application" align="center">
</details>

2. Scan the shipping label👇

<details>
  <summary>Shipping label</summary>
  <img src="demo/parcel-label.jpg?raw=true" alt="A picture of a parcel" align="center">
</details>

## How to run the sample app locally

The sample app implements three servers in these programming languages: 

- [Python](server/python)
- [Node.js/JavaScript](server/node)
- [Go](server/go)

The [client](client) is a single HTML page with Vanilla JavaScript.

### 1. Clone this repository

```bash
git clone https://github.com/algolia-samples/delivery-scanner
```

Copy the file `.env.example` to the directory of the server you want to use and rename it to `.env.`.
For example, to use the Go implementation:

```bash
cp .env.example server/go/.env
```

### 2. Set up Algolia

To use this sample app, you need an Algolia account. If you don't have one already, [create an account for free](https://www.algolia.com/users/sign-up). Note your [Application ID](https://deploy-preview-5789--algolia-docs.netlify.app/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/importing-with-the-api/#application-id) and [API key](https://deploy-preview-5789--algolia-docs.netlify.app/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/importing-with-the-api/#application-id).

In the `.env` file, set the environment variables `ALGOLIA_APP_ID` and `ALGOLIA_API_KEY` to the values from your Algolia account.

```bash
ALGOLIA_APP_ID=<replace-with-your-algolia-app-id>
ALGOLIA_API_KEY=<replace-with-your-algolia-api-key>
```

### 3. Create your Algolia index and upload data

[Create and populate an index](https://www.algolia.com/doc/guides/sending-and-managing-data/prepare-your-data/)
with names, Slack IDs, and images of people you want to notify.

The sample app expects the index record to follow this structure:
```json
{
    "displayName": "Jane Doe",
    "slack": {
        "id": "U01GC09PJEN",
        "image": "https://thispersondoesnotexist.com/image"
    }
}
```

To upload your data, you can use the [Algolia dashboard](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/importing-from-the-dashboard/) or use on of Algolia's [API clients](https://www.algolia.com/developers/#integrations).

After creating the index and uploading the data, set the environment variable `ALGOLIA_INDEX_NAME` in the `.env` file:

```bash
ALGOLIA_INDEX_NAME=<replace-with-your-algolia-index-name>
```

### 4. Set up Google Cloud Vision and Slack

[**Set up your Google Cloud account**](https://cloud.google.com/vision/docs/ocr) to use the Google Cloud Vision API.
In the `.env` file, set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of your credentials file:

```bash
GOOGLE_APPLICATION_CREDENTIALS=<replace-with-the-path-of-your-credentials-file>
```

[Create a Slack application](https://slack.com/help/articles/115005265703-Create-a-bot-for-your-workspace) and set the environment variable `SLACK_TOKEN` in the file `.env`:

```bash
SLACK_TOKEN=<replace-with-the-slack-bot-token>
```

### 5. Follow the instructions in the server directory 

Each server directory has a file with instructions: 

- [Go](server/go/README)
- [Node.js](server/node/README)
- [Python](server/python/README)

For example, to run the Python implementation of the server, follow these steps:

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
