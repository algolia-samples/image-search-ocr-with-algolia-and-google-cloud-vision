"""Delivery Scanner sample application in Python"""

import json
import os

from algoliasearch.search_client import SearchClient
from dotenv import load_dotenv, find_dotenv
from flask import Flask, render_template, jsonify, request, send_from_directory
from google.cloud import vision
from slack_sdk.web.client import WebClient

load_dotenv(find_dotenv())

# Setup the Algolia client
algolia = SearchClient.create(
    app_id=os.getenv('ALGOLIA_APP_ID'),
    api_key=os.getenv('ALGOLIA_API_KEY')
)
employees_index = algolia.init_index(os.getenv('ALGOLIA_INDEX_NAME'))

# Setup the Google Cloud client
# https://cloud.google.com/vision/docs/libraries
gc_vision = vision.ImageAnnotatorClient()

# Setup the Slack client
slack = WebClient(token=os.getenv('SLACK_TOKEN'))

# Setup Flask
STATIC_DIR = str(
    os.path.abspath(os.path.join(
        __file__,
        '..',
        os.getenv('STATIC_DIR')
    ))
)
app = Flask(
    __name__,
    static_folder=STATIC_DIR,
    static_url_path="",
    template_folder=STATIC_DIR
)

@app.route('/', methods=['GET'])
def scanner():
    """Display the scanner interface."""
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    """Scan the delivery's label and identify the recipient."""
    
    # We ask Google Cloud Vision to extract the text from the label picture.
    # https://cloud.google.com/vision/docs/ocr
    try:
        label = request.files['label']
        image = vision.Image(content=label.read())
        res = gc_vision.text_detection(image=image)
        label_text = res.text_annotations[0].description.replace('\n', ' ')
    except Exception as err:
        return jsonify(error=str(err)), 400

    # We search our employees index for a match, using the `removeWordsIfNoResults=allOptional` option.
    # https://www.algolia.com/doc/api-reference/api-parameters/removeWordsIfNoResults/
    results = employees_index.search(
        label_text,
        {'removeWordsIfNoResults': 'allOptional'}
    )

    try:
        # Always return the first hit.
        return jsonify(results['hits'][0]), 200
    except IndexError:
        return jsonify(error='Employee not found'), 400

@app.route('/notify', methods=['POST'])
def notify():
    """Notify the delivery's recipient via Slack."""
    employee = request.get_json()

    try:
        slack.chat_postMessage(
            channel=employee['slackID'],
            text='A :package: is waiting for you at the front desk!',
            as_user=True,
        )
        return jsonify(), 200
    except Exception as err:
        return jsonify(error=str(err)), 400
