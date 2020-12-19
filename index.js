import LatLon from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js';

const gpx_input = document.getElementById("gpx-input");
gpx_input.addEventListener("change", handleFiles, false);
function handleFiles() {
    const gpx_file = this.files[0];
    const reader = new FileReader();
    reader.onload = onLoad;
    reader.readAsText(gpx_file)
}

let track = [];
let route_start, route_end;

function onLoad(e) {
    const text = e.target.result;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xhtml+xml");

    for (const point of doc.getElementsByTagName("trkpt")) {
        track.push(new LatLon(point.getAttribute("lat"), point.getAttribute("lon")))
    }

    let route = [];
    for (const point of doc.getElementsByTagName("rtept")) {
        route.push(new LatLon(point.getAttribute("lat"), point.getAttribute("lon")))
    }
    if (route.length != 2) {
        throw "Route must have exactly 2 points";
    }
    [route_start, route_end] = route;
}

