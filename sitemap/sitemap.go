package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type City struct {
	Name string
}

func main() {
	err := godotenv.Load(".env")

	if err != nil {
		panic(err.Error())
	}

	db := connectToDb()
	defer db.Close()

	results, err := db.Query("SELECT name FROM cities")

	if err != nil {
		panic(err.Error())
	}

	f, err := os.Create("sitemap.txt")

	if err != nil {
		panic(err.Error())
	}

	defer f.Close()

	for results.Next() {
		var city City

		err = results.Scan(&city.Name)

		if err != nil {
			panic(err.Error())
		}

		_, err := f.WriteString("https://videosonmap.com/city/" + city.Name + "\n")

		if err != nil {
			panic(err.Error())
		}
	}

	fmt.Println("Sitemap was built")
}

func connectToDb() *sql.DB {
	err := godotenv.Load(".env")

	if err != nil {
		panic(err.Error())
	}

	db, err := sql.Open("mysql", os.Getenv("DB_USER")+":"+os.Getenv("DB_PASSWORD")+"@tcp(127.0.0.1:3306)/"+os.Getenv("DB_DATABASE"))

	if err != nil {
		panic(err.Error())
	}

	return db
}
