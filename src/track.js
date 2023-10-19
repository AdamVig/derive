// This file is adapted from taterbase/gpx-parser
//
// https://github.com/taterbase/gpx-parser
//
// See https://www.topografix.com/gpx/1/1 for details on the schema for
// GPX files.

import { XMLParser } from 'fast-xml-parser';
import FitParser from 'fit-file-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix : '',
    attributesGroupName : '$',
});

function extractGPXTracks(gpx) {
    if (!gpx.trk && !gpx.rte) {
        console.log('GPX file has neither tracks nor routes!', gpx);
        throw new Error('Unexpected gpx file format.');
    }

    const parsedTracks = [];

    if (gpx.trk) {
        const tracks = gpx.trk.length > 0 ? gpx.trk : [gpx.trk]

        tracks.forEach(trk => {
            let name = trk.name && trk.name.length > 0 ? trk.name[0] : 'untitled';
            let timestamp;
            const trackSegments = trk.trkseg.length > 0 ? trk.trkseg : [trk.trkseg]

            trackSegments.forEach(trkseg => {
                let points = [];
                for (let trkpt of trkseg.trkpt || []) {
                    if (trkpt.time && typeof trkpt.time === 'string') {
                        timestamp = new Date(trkpt.time);
                    }
                    if (typeof trkpt.$ !== 'undefined' &&
                        typeof trkpt.$.lat !== 'undefined' &&
                        typeof trkpt.$.lon !== 'undefined') {
                        points.push({
                            lat: parseFloat(trkpt.$.lat),
                            lng: parseFloat(trkpt.$.lon),
                            // These are available to us, but are currently unused
                            // elev: parseFloat(trkpt.ele) || 0,
                        });
                    }
                }

                if (points.length > 0) {
                    parsedTracks.push({timestamp, points, name});
                }
            });
        });
    }
    if (gpx.rte) {
        const routes = gpx.rte.length > 0 ? gpx.rte : [gpx.rte]
        routes.forEach(rte => {
            let name = rte.name && rte.name.length > 0 ? rte.name[0] : 'untitled';
            let timestamp;
            let points = [];
            for (let pt of rte.rtept || []) {
                if (pt.time && typeof pt.time[0] === 'string') {
                    timestamp = new Date(pt.time[0]);
                }
                points.push({
                    lat: parseFloat(pt.$.lat),
                    lng: parseFloat(pt.$.lon),
                });
            }

            if (points.length > 0) {
                parsedTracks.push({timestamp, points, name});
            }
        });
    }

    return parsedTracks;
}

function extractTCXTracks(tcx, name) {
    if (!tcx.Activities) {
        console.log('TCX file has no activities!', tcx);
        throw new Error('Unexpected tcx file format.');
    }

    const parsedTracks = [];
    const activities = tcx.Activities.Activity.length > 0 ? tcx.Activities.Activity : [tcx.Activities.Activity];
    for (const act of activities) {
        if (!act.Lap) {
            continue
        }
        const laps = act.Lap.length > 0 ? act.Lap : [act.Lap];
        for (const lap of laps) {
            if (!lap.Track || lap.Track.length === 0) {
                continue;
            }
            let trackPoints = lap.Track.Trackpoint.filter(it => it.Position);
            let timestamp;
            let points = []

            for (let trkpt of trackPoints) {
                if (trkpt.Time && typeof trkpt.Time === 'string') {
                    timestamp = new Date(trkpt.Time);
                }
                points.push({
                    lat: parseFloat(trkpt.Position.LatitudeDegrees),
                    lng: parseFloat(trkpt.Position.LongitudeDegrees),
                    // These are available to us, but are currently unused
                    // elev: parseFloat(trkpt.ElevationMeters) || 0,
                });
            }

            if (points.length > 0) {
                parsedTracks.push({timestamp, points, name});
            }
        }
    }

    return parsedTracks;
}

function extractFITTracks(fit, name) {
    if (!fit.records || fit.records.length === 0) {
        console.log('FIT file has no records!', fit);
        throw new Error('Unexpected FIT file format.');
    }

    let timestamp;
    const points = [];
    for (const record of fit.records) {
        if (record.position_lat && record.position_long) {
            points.push({
                lat: record.position_lat,
                lng: record.position_long,
                // Other available fields: timestamp, distance, altitude, speed, heart_rate
            });
        }
        record.timestamp && (timestamp = record.timestamp);
    }

    return points.length > 0 ? [{timestamp, points, name}] : [];
}

function readFile(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            try {
                return resolve(result);
            } catch (e) {
                return reject(e);
            }
        };

        if (encoding === 'binary') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
}

export default function extractTracks(file) {
    const format = file.name.split('.').pop().toLowerCase();

    switch (format) {
    case 'gpx':
    case 'tcx': /* Handle XML based file formats the same way */

        return readFile(file, 'text')
            .then(textContents => new Promise((resolve, reject) => {
                const result = parser.parse(textContents)
                if (result.gpx) {
                    resolve(extractGPXTracks(result.gpx));
                } else if (result.TrainingCenterDatabase) {
                    resolve(extractTCXTracks(result.TrainingCenterDatabase, file.name));
                } else {
                    reject(new Error('Invalid file type.'));
                }
	    }));

    case 'fit':
        return readFile(file, 'binary')
            .then(contents => new Promise((resolve, reject) => {
                const parser = new FitParser({
                    force: true,
                    mode: 'list',
                });

                parser.parse(contents, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(extractFITTracks(result, file.name));
                    }
                });
            }));

    default:
        throw `Unsupported file format: ${format}`;
    }
}
