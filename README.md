# dérive

![los angeles.](http://i.imgur.com/Asf744D.jpg)

Generate a heatmap from GPS tracks.

Drag and drop one or more GPX/TCX/FIT/IGC/SKIZ files or JPEG images into the browser
window. No data is ever uploaded, everything is done client side.

Loosely inspired by [The Passage Ride](http://thepassageride.com), which you
should join if you ever find yourself in Los Angeles on any given Wednesday
night.

http://library.nothingness.org/articles/SI/en/display/314

## Strava

If you use Strava, go to your
[account download page](https://www.strava.com/athlete/delete_your_account)
and click "Request your archive". You'll get an email containing a ZIP
file of all the GPS tracks you've logged so far. This can take several hours.

## Deployment with Docker

The Docker image is published to the GitHub Container Registry as
[`ghcr.io/adamvig/derive`](https://github.com/users/AdamVig/packages/container/package/derive). The image is based on
the official Nginx image, so [the usage instructions for that
image](https://github.com/docker-library/docs/tree/master/nginx#how-to-use-this-image) apply here as well.

## Developing

```bash
# Install dependencies
$ npm install

# Run server with hot reload for local development
$ npm run serve

# Lint code
$ npm run lint

# Build bundle for deployment
$ npm run build
```
