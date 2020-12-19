import LatLon from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js';

const gpx_input = document.getElementById("gpx-input");
gpx_input.addEventListener("change", handleFiles, false);
function handleFiles() {
    const gpx_file = this.files[0];
    const reader = new FileReader();
    reader.onload = onLoad;
    reader.readAsText(gpx_file)
}

function onLoad(e) {
    const text = e.target.result;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xhtml+xml");

    let track = [];
    for (const point of doc.getElementsByTagName("trkpt")) {
        track.push(new LatLon(point.getAttribute("lat"), point.getAttribute("lon")))
    }
    if (track.length == 0) {
        throw "Track must have at least one point";
    }

    let route = [];
    for (const point of doc.getElementsByTagName("rtept")) {
        route.push(new LatLon(point.getAttribute("lat"), point.getAttribute("lon")))
    }
    if (route.length != 2) {
        throw "Route must have exactly 2 points";
    }
    let [start, end] = route;
    analyze(track, start, end);
}

function analyze(track, start, end) {
    const route_len = start.distanceTo(end);

    let total_deviation = 0;
    let deviation_count = 0;

    let max_deviation = 0;
    let max_deviation_at = null;

    let area = 0;

    let prev_dist = 0;
    for (const point of track) {
        const dist = point.alongTrackDistanceTo(start, end);
        if (dist < 0 || dist > route_len || dist < prev_dist) continue;

        const deviation = Math.abs(point.crossTrackDistanceTo(start, end));
        total_deviation += deviation;
        deviation_count += 1;

        if (deviation > max_deviation) {
            max_deviation = deviation;
            max_deviation_at = point;
        }

        // use simple Riemann sum for area 
        const dist_delta = dist - prev_dist;
        area += deviation * dist_delta;

        prev_dist = dist;
    }

    const average_deviation = total_deviation / deviation_count;
    display(route_len, max_deviation, max_deviation_at, average_deviation, area);
}

function display(route_len, max_dev, max_dev_at, avg_dev, area) {
    console.log(`route length ${(route_len / 1000).toFixed(2)} km`);
    console.log(`maximum deviation ${max_dev.toFixed(2)} m at ${max_dev_at}`);
    console.log(`average deviation ${avg_dev.toFixed(2)} m`);
    console.log(`are enclosed ${area.toFixed(2)} m²`);
}
