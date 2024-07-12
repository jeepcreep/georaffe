const About = () => {
    return (
      <div className='w-full flex-center flex-col text-grey-500 py-4 mx-6'>
        <h1 className='subhead_text'>Georaffe?</h1>
        <p className='text-gray-600'>
          Welcome to GeoRaffe, a pun on 'georef', a place where georeferencing and georectifying is as easy as 1-2-3
        </p>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Contact me</h2>
          <p className='text-gray-600'>
            Drop me a msg at <a href="mailto:nilsweber@gmx.de" className=''>nilsweber@gmx.de</a><br />
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Legal Information</h2>
          <p className='text-gray-600'>
            Built with the help of a few amazing open source libs, license files are/will be included. If you feel something is missing, please just reach out to me!
          </p>
          <p className='text-gray-600'>
            Please only upload images that are 100% free to use without any loyalties or broken copyrights! 
          </p>
          <p className='text-gray-600'>
            Thanks! 🙏🏽
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>The Mission</h2>
          <p className='text-gray-600'>
            To make georeferencing easy and accessible to everyone.
          </p>
        </section>
      </div>
    );
  };
  
  export default About;