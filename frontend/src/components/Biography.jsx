import React from 'react'

const Biography = ({imageUrl}) => {
  return (
    <div className='container biography'>
        <div className='banner'>
            <img src = {imageUrl} alt="aboutImg" />
        </div>
        <div className='banner'>
            <p>Biography</p>
            <h3>Our Story</h3>
            <p>
               ZeeCare Medical Institute is a state-of-the-art facility dedicated
            to providing comprehensive healthcare services with compassion and
            expertise. Our team of skilled professionals is committed to
            delivering personalized care tailored to each patient's needs. At
            ZeeCare, we prioritize your well-being, ensuring a harmonious
            journey towards optimal health and wellness.
            </p>
            <p>
             At ZeeCare, we believe in the power of personalized care.
            </p>
            <p> Our mission is to provide the highest.</p>
            <p> We are committed to delivering exceptional care with a focus on prevention, early detection, and patient-centered care.</p>
            <p> Our team of skilled professionals is committed to delivering personalized care tailored to each patient's.</p>
            <p> We are committed to delivering exceptional care.</p>
        </div>
    
    </div>
  )
}

export default Biography

