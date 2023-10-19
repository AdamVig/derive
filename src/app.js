import GpxMap from './map';
import extractTracks from './track'
import {initialize} from './ui';

/**
 * Fetch the list of tracks from the back end.
 * @returns Array of filenames available at the tracks endpoint
 */
async function fetchTrackFileList() {
    const response = await fetch('/tracks/');
    const data = await response.json();
    return data
        .map(({name}) => name)
	.filter((maybeTrackName) => maybeTrackName !== undefined)
        // Ensure each name ends with a supported file extension
        .filter((name) => /.*\.(gpx|tcx|fit)?$/.test(name));
    
}

/**
 * Fetch a track file from the back end.
 * @param {string} trackName Filename available at the tracks endpoint
 * @returns {string} Contents of a track file
 */
function fetchTrackFile(trackName) {
    return fetch(`/tracks/${trackName}`)
	.then((response) => response.blob())
	.then((file) => {
	    // Add name for extractTracks
	    file.name = trackName;
	    return file;
	})
}

function addTrackToMap(track, map) {
    if (Array.isArray(track)) {
        for (const trackItem of track) {
            map.addTrack(trackItem)
        }
    } else {
        map.addTrack(track);
    }
}

async function app() {
    let map = new GpxMap();
    map.restoreSavedOptions();
    
    initialize(map);

    const trackFileList = await fetchTrackFileList()
    if (trackFileList.length === 0) {
        console.warn('No tracks are available from the back end');
    }

    const batchSize = 50
    let position = 0;
    let results = [];
    while (position < trackFileList.length) {
        const itemsForBatch = trackFileList.slice(position, position + batchSize);
        results = results.concat(
	    await Promise.all(
		itemsForBatch.map(
		    async (trackName) => {
			const trackFile = await fetchTrackFile(trackName);
			const track = await extractTracks(trackFile)
			addTrackToMap(track, map)
		    }
		)
	    )
	);
        position += batchSize;
    }
}

document.addEventListener('DOMContentLoaded', app);
