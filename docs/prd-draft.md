# Initial Plan

## Project goal

A web app for users to edit captions easily for their videos.

Defintion: A caption is a timed text representation of spoken words and relevant sounds in a video.  A caption is composed of a list of text segments, each containing a start timestamp, an end timestamp, and the associated text.

## Proposed user stories

* As a user, I can import a video file from a local directory and make it display in the app, so that I can edit its caption.
* As a user, I can create and edit the caption from the scratch on some visual editor in the app which displays both caption texts, timestamps, and the video, so that I can edit the caption according to the video.
* As a user, I can play, pause and randomly seek the video, and the caption editor shall allow me to easily edit the caption text around that timestamp.
* As a user, I can import an existing caption file, which contains text segments and timestamps, from local or from an URL, so that I can continue on someone else's work.
* As a user, I can use a preset AI module which converts the video to a caption, so that I can use the first version of caption as a starting point.
* As a user, I can override the timestamps of segments from the imported caption.
* As a user, I can override the segment texts from the imported caption.
* As a user, I can export or download my current work of caption to my local computer.

* As a developer of this app, I can easily develop and plugin AI module(s) that convert a video to caption, so the user can use it to start their work.
* As a developer of this app, I can easily develop a module that loads an existing caption, for example from the user's local directory, an AWS S3 bucket, a Google Drive, ..., so that the user can easily import an existing work in various kinds of ways

### Nice-to-have features, keep the flexibility

* Given a video and a transcription without timestamps, a module in the app can do the alignment to cut the transcript text into segments and give them starting and ending timestamp.
* Given a video and a caption, a module in the app can translate from the caption language to another language considering the segmentations and timestamps.

## Proposed architecture draft

The core of the web app is a Web UI editor that can play a video and provide a caption editor (text segments + timestamps) side-by-side.

The app should be designed for multiple pluggable modules.  The communication among modules and the web UI core should support both HTTP API and the local code in the same container.

The app should contain at least the following modules if not more, and architecture should allow the developers develop and swap between them easily:
* Caption generation from video
* Caption import
* Caption export
* Timestamp alignment given a video and a transcript without time information (Nice to have)
* Cpation translation (Nice to have)

Use Javascript or Typescript ecosystem for web UI and SSR.  Use Python for the rest of the modules.

Use monorepo.

## Deployment

The application should be able to run on both a cloud provider like AWS/GCP/Azure or the user's machine locally if the user has enough knowledge on DevOps.  Use docker / container for artifact and deployment.

## AI captioning module execution

For the initial AI captioning MVP, use a simple, fast-setup third party API service provider.  Simplicity over quality.  You can assume the user will obtain API key of that service if necessary.  Use web search if you are not sure which to use.

However, you should not restrict how the AI captioning is served.  They can be running on the same machine the code resides, or from an API service hosted by us or another company.  Be sure to consider this when scaffolding!

## Caption format

Focus on VTT and SRT for now.