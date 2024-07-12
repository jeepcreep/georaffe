## Warning: 
this repo is heavily WIP and there a still quite a few things missing - it's merely my private-yet-public pet project


## Welcome to GeoRaffe, 

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

Prerequisites for tiling the uploaded images:

* gdal (https://gdal.org/) >= 3.6.0
    * either have this installed globally
    * or via conda:
        * `conda create -n gdal python=3.9`
        * `conda activate gdal` or `source activate gdal`
        * `conda install gdal`

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the page in action.

