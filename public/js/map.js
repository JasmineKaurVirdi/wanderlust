const mapElement = document.getElementById("map");

const listingLocation = mapElement.dataset.location;
const coordinates = JSON.parse(mapElement.dataset.coordinates);

const lon = coordinates[0];
const lat = coordinates[1];

const map = L.map("map").setView([lat, lon], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const redIcon = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0,-32]
});

L.marker([lat, lon], { icon: redIcon })
    .addTo(map)
    .bindPopup(`<h4>${listingLocation}</h4><p>Exact Location will be provided after booking</p>`);