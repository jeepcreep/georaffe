const HowTo = () => {
    return (
      <div className='w-full flex-center flex-col text-grey-500 py-4 mx-6'>
        <h1 className='subhead_text'>How to</h1>
        <p className='text-gray-600'>
          Here's how it works:
        </p>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Step 1</h2>
          <p className='text-gray-600'>
            Find and upload a raster image of a known geographical location, preferably in high quality.
          </p>
          <p className='text-gray-600'>
            Upon upload, give a meaningful title and how far in want to be able to zoom during georeferencing.
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Step 2</h2>
          <p className='text-gray-600'>
            Find landmarks, like places or streets, that are present in both maps and whose location has not changed. 
          </p>
          <p className='text-gray-600'>
            Pick those "ground control points" on both maps and hit "Save control point" respectively.
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Step 3</h2>
          <p className='text-gray-600'>
            When at least 3 control points have been selected, a button "Overlay map" appears.
          </p>
          <p className='text-gray-600'>
            When you press it, your uploaded map appears superimposed on the OSM.
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Hints:</h2>
          <p className='text-gray-600'>
            You can check how well the image is aligned by using the opactiy slider!
          </p>
          <p className='text-gray-600'>
            If the overlay map lacks precision, it's usually due to imprecision during georeferencing.
          </p>
          <p className='text-gray-600'>
            You can always edit existing control points by selecting them and adding more can enhance precision.
          </p>
        </section>
      </div>
    );
  };
  
  export default HowTo;