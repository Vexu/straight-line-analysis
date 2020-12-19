import LatLon from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js';

const gpx_input = document.getElementById("gpx-input");
gpx_input.onchange = function() {
    const gpx_file = this.files[0];
    const reader = new FileReader();
    reader.onload = onLoad;
    reader.readAsText(gpx_file)
};
const file_upload = document.getElementById("file-upload");
file_upload.ondragover = file_upload.ondragenter = (e) => e.preventDefault();
file_upload.ondrop = function(e) {
    const gpx_file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = onLoad;
    reader.readAsText(gpx_file)

    e.preventDefault();
};

const error_msg = document.getElementById("error-msg");

function onLoad(e) {
    error_msg.style.display = "none";
    try {
        parseGPX(e.target.result);
    } catch (err) {
        error_msg.innerText = err;
        error_msg.style.display = "block";
    }
}

function parseGPX(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "application/xhtml+xml");
    if (doc.getElementsByTagName("parsererror").length != 0) {
        throw "GPX file failed to parse";
    }

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

const deviation_plot_layout = {
    yaxis: {
        title: "deviation from line (m)"
    },
    xaxis: {
        title: "distance from start (m)"
    }
};

function analyze(track, start, end) {
    const route_len = start.distanceTo(end);
    let track_len = 0;

    let total_deviation = 0;

    let max_deviation = 0;
    let max_deviation_at = null;

    let area = 0;

    let deviations = [];
    let distances = [];

    let prev_point = null;
    let prev_dist = 0;
    for (const point of track) {
        const dist = point.alongTrackDistanceTo(start, end);
        if (dist < 0 || dist > route_len || dist < prev_dist) continue;
        
        if (prev_point != null) {
            track_len += point.distanceTo(prev_point);
        }
        prev_point = point;

        const deviation = Math.abs(point.crossTrackDistanceTo(start, end));
        total_deviation += deviation;

        deviations.push(deviation);
        distances.push(dist);

        if (deviation > max_deviation) {
            max_deviation = deviation;
            max_deviation_at = point;
        }

        if (prev_dist == 0) {
            prev_dist = dist;
        }

        // use simple Riemann sum for area 
        const dist_delta = dist - prev_dist;
        area += deviation * dist_delta;

        prev_dist = dist;
    }

    
    var trace1 = {
        x: distances,
        y: deviations,
        type: "scatter",
    };
    Plotly.newPlot('deviation-plot', [trace1], deviation_plot_layout, {responsive: true});

    const average_deviation = total_deviation / deviations.length;
    display(route_len, track_len, max_deviation, max_deviation_at, average_deviation, area);
}

function display(route_len, track_len, max_dev, max_dev_at, avg_dev, area) {
    console.log(`route length ${(route_len / 1000).toFixed(2)} km`);
    console.log(`track length ${(track_len / 1000).toFixed(2)} km`);
    console.log(`maximum deviation ${max_dev.toFixed(2)} m at ${max_dev_at}`);
    console.log(`average deviation ${avg_dev.toFixed(2)} m`);
    console.log(`are enclosed ${area.toFixed(2)} m²`);

    document.getElementById('route-len').innerText = (route_len / 1000).toFixed(2);
    document.getElementById('track-len').innerText = (track_len / 1000).toFixed(2);
    document.getElementById('max-dev').innerText = max_dev.toFixed(2);
    document.getElementById('max-dev-at').innerText = max_dev_at;
    document.getElementById('avg-dev').innerText = avg_dev.toFixed(2);
    document.getElementById('area').innerText = area.toFixed(2);
}
