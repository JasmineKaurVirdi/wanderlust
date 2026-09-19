const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
        let category = req.query.category;
        let search = req.query.search;
        if (category) {
                const allListings = await Listing.find({ category });

                if (allListings.length === 0) {
                        req.flash("error", "Category not found!");
                        return res.redirect("/listings");
                }

                res.render("listings/index.ejs", { allListings, category, search });

        } else if (search) {
                const allListings = await Listing.find({ location: search });

                if (allListings.length === 0) {
                        req.flash("error", `No listings found for ${search}`);
                        return res.redirect("/listings");
                }
                res.render("listings/index.ejs", { allListings, category, search });
        } else {
                const allListings = await Listing.find({});
                res.render("listings/index.ejs", { allListings, category, search });
        }
};

module.exports.renderNewForm = (req, res) => {
        res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id)
                .populate({
                        path: "reviews",
                        populate: {
                                path: "author",
                        },
                })
                .populate("owner");
        if (!listing) {
                req.flash("error", "Listing you requested for does not exist!");
                return res.redirect("/listings");
        }
        res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
        let url = req.file.path;
        let filename = req.file.filename;
        const newCreatedListing = new Listing(req.body.listing);
        newCreatedListing.owner = req.user._id;
        newCreatedListing.image = { url, filename };
        let location = newCreatedListing.location;
        let country = newCreatedListing.country;

        //Nominatim
        const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
                        location 
                )}`,
                {
                        headers: {
                                "User-Agent": "wanderlust1/1.0"
                        }
                }
        );

        const data = await response.json();

        console.log("Nominatim data:", data);

        if (data.length === 0) {
                req.flash("error", "Location not found!");
                return res.redirect(`/listings/new`);
        }

        let foundCountry = data[0].address?.country;

        if(!foundCountry || foundCountry.toLowerCase() !== country.toLowerCase()){
                req.flash("error", "Country not found!");
                return res.redirect(`/listings/new`);
        };


        newCreatedListing.geometry = {
                type: "Point",
                coordinates: [
                        parseFloat(data[0].lon),
                        parseFloat(data[0].lat)
                ]
        };
        let savedListing = await newCreatedListing.save();
        console.log(savedListing);

        req.flash("success", "New Listing created!");
        res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
                req.flash("error", "Listing you requested for does not exist!");
                return res.redirect("/listings");
        }

        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
        let { id } = req.params;

        let location = req.body.listing.location;
        let country = req.body.listing.country;


        //Nominatim
        const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
                        location
                )}`,
                {
                        headers: {
                                "User-Agent": "wanderlust1/1.0"
                        }
                }
        );

        const data = await response.json();

        console.log("Nominatim data:", data);

        if (data.length === 0) {
                req.flash("error", "Location not found!");
                return res.redirect(`/listings/${id}/edit`);
        }

        let foundCountry = data[0].address?.country;

        if(!foundCountry || foundCountry.toLowerCase() !== country.toLowerCase()){
                req.flash("error", "Country not found!");
                return res.redirect(`/listings/${id}/edit`);
        };

        //Update listing
        let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, {new: true});

        if (typeof req.file !== "undefined") {
                let url = req.file.path;
                let filename = req.file.filename;
                listing.image = { url, filename };
        }

        //New coordinates
        listing.geometry = {
                type: "Point",
                coordinates: [
                        parseFloat(data[0].lon),
                        parseFloat(data[0].lat)
                ]
        };
        await listing.save();

        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
        let { id } = req.params;
        let dListing = await Listing.findByIdAndDelete(id);
        console.log(dListing);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
};

module.exports.searchSuggestions = async (req, res) => {
        let { search } = req.query;
        let listings = await Listing.find({
                location: { $regex: `^${search}`, $options: "i" }
        });
        res.json(listings);
};