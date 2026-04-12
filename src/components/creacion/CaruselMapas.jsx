import React from 'react'
import { Carousel } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '../../styles/mapas.css'
import Piso3 from '../../assets/mapas/piso_3.svg'
import Piso9 from '../../assets/mapas/piso_9.svg'
import PisoMZ from '../../assets/mapas/piso_MZ.svg'
import PisoPB from '../../assets/mapas/piso_PB.svg'

const CaruselMapas = () => {
  return (
    <>
      <Carousel interval={null} className='mapa-carusel'>
        <Carousel.Item>
          <svg className='mapa-carusel-item'>
            <image className = 'mapas-svg' href={Piso3} />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item'>
            <image className = 'mapas-svg' href={Piso9} />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item'>
            <image className = 'mapas-svg' href={PisoMZ} />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item'>
            <image className = 'mapas-svg' href={PisoPB} />
          </svg>
        </Carousel.Item>
      </Carousel>
    </>
  )
}

export default CaruselMapas