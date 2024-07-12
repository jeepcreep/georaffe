> [!WARNING] 
> this repo is heavily WIP and there a still quite a few things missing - it's merely my private-yet-public pet project


![GeoRaffe is where you can compare maps through the beauty of georeferencing and georectifying](/public/assets/icons/georaffe.png) 

## Welcome to GeoRaffe, 

See it live [here](https://georaffe.org/)

a full-fledged platform for georeferencing and georectifying raster images. Uploaded images will automatically be tiled (using a modified version of gdal2tiles), uploaded to an S3 bucket and served as XYZ tiles.
The workflow is as such:

* sign up using Google
* upload a new map file (PNG or JPG, max. 20MB), give it a meaningful title and a maximum zoom-level which is used for the depth of tiling (will drastically increase number of tiles and overall space needed but makes zooming in on larger map files more performant)
* start the georeferencing process by looking for identical landmarks on both your uploaded images and the reference OSM map, click on the actual position as precisely as possible on both panes respectively (these points in GIS jargon are called 'ground control points' or GCPs)
* you can click and drag any GCP until you are content with its position, then click on "save control point" after
* existing GCPs can later be edited or deleted by clicking them and choosing the according action (note that the according action will be executed on either GCP)
* after having set at least 3 GCPs, an "Overlay map" button will appear on top of the panes
* click it to see the georeferenced images georectified ("rubbersheet") form as overlay image on top of the OSM map
* you can verify how well the control points have been set by using the opacity slider on top of the overlay pane

## Getting Started

Required tools installed or services running:

* GDAL (https://gdal.org/) >= 3.6.0
    * either have this installed globally
    * or via conda:
        * `conda create -n gdal python=3.9`
        * `conda activate gdal` or `source activate gdal`
        * `conda install gdal`
* MongoDB (locally or remote):
    * expose MONGODB_URI and MONGODB_DBNAME as (secret) env vars
    * remember to use different values for dev and prod
* Google OAuth client:
    * expose GOOGLE_ID and GOOGLE_CLIENT_SECRET as (secret) env vars
    * remember to use different values for dev and prod
* S3 bucket reachable either from anywhere or matched to your deployed domain (please make sure to allow CORS!)
    * expose AWS_S3_ACCESSKEYID, AWS_S3_SECRETACCESSKEY secretly
    * in addition the following default values are set for a few additional env vars (as per .env):
        * AWS_S3_REGION=eu-central-1
        * AWS_S3_TILES_BUCKET=georef-tiles
        * AWS_S3_IAM=georef-bucket-user (the IAM account with adequate permission to read, write and modify above bucket)
        * NEXT_PUBLIC_AWS_S3_REGION=eu-central-1
        * NEXT_PUBLIC_AWS_S3_TILES_BUCKET=georef-tiles
* Also in order to deploy to production don't forget to adapt HOST_BASE_URL in .env.production to match your domain


Run in development (port 3000):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see GeoRaffe in action.

