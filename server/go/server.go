package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"

	vision "cloud.google.com/go/vision/apiv1"
	"github.com/algolia/algoliasearch-client-go/v3/algolia/opt"
	"github.com/algolia/algoliasearch-client-go/v3/algolia/search"
	"github.com/joho/godotenv"
	"github.com/slack-go/slack"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatalf("godotenv.Load: %v", err)
	}

	http.Handle("/", http.FileServer(http.Dir(os.Getenv("STATIC_DIR"))))
	http.HandleFunc("/scan", handleScan)
	http.HandleFunc("/notify", handleNotify)

	addr := "0.0.0.0:4242"
	log.Printf("Listening on %s ...", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func handleScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	// Handle the uploaded package's label
	r.ParseMultipartForm(10 << 20) // 10MB Max
	file, _, err := r.FormFile("label")
	if err != nil {
		writeJSON(w, nil, err)
		log.Println("Error Retrieving the label image")
		log.Println(err)
		return
	}

	// Detect text from the label using Google Cloud Vision
	// https://cloud.google.com/vision/docs/ocr
	ctx := context.Background()
	ia_client, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}
	image, err := vision.NewImageFromReader(file)
	if err != nil {
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}
	annotation, err := ia_client.DetectDocumentText(ctx, image, nil)
	if err != nil || annotation == nil {
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}

	log.Println("Text:", annotation.Text)

	// Replace all line break by spaces
	re := regexp.MustCompile(`\n`)
	text := re.ReplaceAllString(annotation.Text, "")

	// Setup the Algolia client
	a_client := search.NewClient(os.Getenv("ALGOLIA_APP_ID"), os.Getenv("ALGOLIA_API_KEY"))
	index := a_client.InitIndex(os.Getenv("ALGOLIA_INDEX_NAME"))

	// Search our employees index for a match, using the `removeWordsIfNoResults=allOptional` option.
	// https://www.algolia.com/doc/api-reference/api-parameters/removeWordsIfNoResults/
	result, err := index.Search(text, opt.RemoveWordsIfNoResults("allOptional"))
	if err != nil {
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}
	if len(result.Hits) == 0 {
		err = errors.New("employee not found")
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}

	writeJSON(w, result.Hits[0], nil)
}

func handleNotify(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		SlackID string `json:"slackID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, nil, err)
		log.Printf("json.NewDecoder.Decode: %v", err)
		return
	}

	s_client := slack.New(os.Getenv("SLACK_TOKEN"))
	_, _, _, err := s_client.SendMessage(
		req.SlackID,
		slack.MsgOptionText("A :package: is waiting for you at the front desk!", false),
		slack.MsgOptionAsUser(true),
	)
	if err != nil {
		writeJSON(w, nil, err)
		log.Println(err)
		return
	}
	var res struct{}
	writeJSON(w, res, nil)
}

type errResp struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, v interface{}, err error) {
	var respVal interface{}
	if err != nil {
		msg := err.Error()
		w.WriteHeader(http.StatusBadRequest)
		var e errResp
		e.Error = msg
		respVal = e
	} else {
		respVal = v
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(respVal); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		log.Printf("json.NewEncoder.Encode: %v", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, &buf); err != nil {
		log.Printf("io.Copy: %v", err)
		return
	}
}
