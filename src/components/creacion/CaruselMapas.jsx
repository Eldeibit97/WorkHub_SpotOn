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
          <svg className='mapa-carusel-item' viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano piso 3">
            <image className="mapas-svg" href={Piso3} width="800" height="600" preserveAspectRatio="xMidYMid meet" />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item' viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano piso 9">
            <image className="mapas-svg" href={Piso9} width="800" height="600" preserveAspectRatio="xMidYMid meet" />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item' viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano mezzanine">
            <image className="mapas-svg" href={PisoMZ} width="800" height="600" preserveAspectRatio="xMidYMid meet" />
          </svg>
        </Carousel.Item>
        <Carousel.Item>
          <svg className='mapa-carusel-item' viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano planta baja">
            <image className="mapas-svg" href={PisoPB} width="800" height="600" preserveAspectRatio="xMidYMid meet" />
          </svg>
        </Carousel.Item>
      </Carousel>
    </>
  )
}

export default CaruselMapas