const About = () => {
    return (
      <div className='w-full flex-center flex-col text-grey-500 py-4 mx-6'>
        <h1 className='subhead_text'>Georaffe?</h1>
        <p className='desc_medium text-center text-gray-600'>
          Welcome to GeoRaffe, a pun on 'georef', a place where georeferencing and georectifying is as easy as 1-2-3
        </p>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Contact me</h2>
          <p className='desc_medium text-center text-gray-600'>
            Drop me a msg at <a href="mailto:nilsweber@gmx.de" className=''>nilsweber@gmx.de</a><br />
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>The Mission</h2>
          <p className='desc_medium text-center text-gray-600'>
            To make georeferencing easy and accessible to everyone.
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Legal Information</h2>
          <p className='desc_medium text-center text-gray-600'>
            Built with the help of a few amazing open source libs, license files are/will be included. If you feel something is missing, please just reach out to me!
          </p>
          <p className='desc_medium text-center text-gray-600'>
            Please only upload images that are 100% free to use without any loyalties or broken copyrights! 
          </p>
          <p className='desc_medium text-center text-gray-600'>
            Thanks! 🙏🏽
          </p>
        </section>
        <section className='w-full flex-center flex-col my-3'>
          <h2 className='subhead2_text'>Privacy policy</h2>
          <p className='desc_medium text-center text-gray-600'>
            This website uses certain parts of your Google account to create a profile.
          </p>
          <p className='desc_medium text-center text-gray-600'>
            These parts are: your name to show to other users potentially in the future (not yet activated), 
            your e-mail address to create the actual account (aka create a unique login identifier internally)
            as well as your profile picture to show on the top right side of the website as well as on your profile page (not yet activated).
          </p>
          <p className='desc_medium text-center text-gray-600'>
            All of the information mentioned are needed in order to log you in, create an account for you
            so you can come back and have your lovely maps persisted. None of your information will be used
            anything other than realizing the pure functionality of georaffe.org.
          </p>
        </section>
      </div>
    );
  };
  
  export default About;