const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const axios = require("axios");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust1";

main()
.then(res => 
    console.log("connected to DB"))
.catch(err => 
    console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});

    const updatedData = [];

    for (let obj of initData.data) {
        try {
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: `${obj.location}, ${obj.country}`,
                        format: "json",
                        limit: 1
                    },
                    headers: {
                        "User-Agent": "wanderlust1"
                    }
                }
            );

            console.log("Nominatim data:", response.data);

            if (response.data.length > 0) {
                const data = response.data[0];

                obj.geometry = {
                    type: "Point",
                    coordinates: [
                        parseFloat(data.lon),
                        parseFloat(data.lat)
                    ]
                };
            }

            updatedData.push({
                ...obj,
                owner: "6aac00f8e088537adf40e7ce"
            });

        } catch (err) {
            console.log("Nominatim error:", err.message);
        }
    }

    await Listing.insertMany(updatedData);

    console.log("data was initialized");
};

initDB();