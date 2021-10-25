package main

import (
	"database/sql"
	"encoding/json"
	"html/template"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	_ "github.com/go-sql-driver/mysql"
)

const IndexLat = "52"
const IndexLng = "21"
const IndexZoom = 5
const CityZoom = 15

type MapTemplate struct {
	Title string
	Lat   string
	Lng   string
	Zoom  int
}

type Video struct {
	YoutubeId string `json:"youtube_id"`
	Lat       string `json:"lat"`
	Lng       string `json:"lng"`
}

type Videos []Video

type City struct {
	Lat string
	Lng string
}

type VideosJsonResponse struct {
	Type    string `json:"type"`
	Data    Videos `json:"data"`
	Message string `json:"message"`
}

func main() {
	err := godotenv.Load(".env")

	if err != nil {
		panic(err.Error())
	}

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))
	http.Handle("/sitemap/", http.StripPrefix("/sitemap/", http.FileServer(http.Dir("sitemap"))))
	http.HandleFunc("/api/videos", getVideos)
	http.HandleFunc("/city/", showCity)
	http.HandleFunc("/", showMap)
	http.ListenAndServe(":"+os.Getenv("HTTP_PORT"), nil)
}

func showCity(w http.ResponseWriter, r *http.Request) {
	citySlug := r.URL.Path[len("/city/"):]

	db := connectToDb()
	defer db.Close()

	results, err := db.Query("SELECT lat, lng FROM cities WHERE name=? LIMIT 1", citySlug)

	if err != nil {
		panic(err.Error())
	}

	results.Next()

	var city City

	err = results.Scan(&city.Lat, &city.Lng)

	if err != nil {
		panic(err.Error())
	}

	tmpl, _ := template.ParseFiles("templates/map.tmpl")
	tmpl.Execute(w, MapTemplate{
		Title: citySlug + " walking and driving videos on map",
		Lat:   city.Lat,
		Lng:   city.Lng,
		Zoom:  CityZoom,
	})
}

func showMap(w http.ResponseWriter, r *http.Request) {
	tmpl, _ := template.ParseFiles("templates/map.tmpl")
	tmpl.Execute(w, MapTemplate{
		Title: "Walking and driving Youtube videos on map",
		Lat:   IndexLat,
		Lng:   IndexLng,
		Zoom:  IndexZoom,
	})
}

func getVideos(w http.ResponseWriter, r *http.Request) {
	keys := r.URL.Query()
	llat := keys.Get("llat")
	llng := keys.Get("llng")
	rlat := keys.Get("rlat")
	rlng := keys.Get("rlng")

	db := connectToDb()
	defer db.Close()

	results, err := db.Query("SELECT youtube_id, lat, lng FROM videos WHERE lat > ? AND lat < ? AND lng > ? AND lng < ? ORDER BY rating LIMIT 100", llat, rlat, llng, rlng)

	if err != nil {
		panic(err.Error())
	}

	var videos Videos

	for results.Next() {
		var video Video

		err = results.Scan(&video.YoutubeId, &video.Lat, &video.Lng)

		if err != nil {
			panic(err.Error())
		}

		videos = append(videos, Video{YoutubeId: video.YoutubeId, Lat: video.Lat, Lng: video.Lng})
	}

	var response = VideosJsonResponse{Type: "success", Data: videos}

	json.NewEncoder(w).Encode(response)
}

func connectToDb() *sql.DB {
	err := godotenv.Load(".env")

	if err != nil {
		panic(err.Error())
	}

	db, err := sql.Open("mysql", os.Getenv("DB_USER")+":"+os.Getenv("DB_PASSWORD")+"@tcp(127.0.0.1:3306)/youtube")

	if err != nil {
		panic(err.Error())
	}

	return db
}
