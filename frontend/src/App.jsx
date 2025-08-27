import { Routes, Route, Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ScrambleText } from './components/ScrambleText.jsx'
import { useImageLoader } from './hooks/useImageLoader.js'

function Layout({ children }) {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        setShowBackToTop(window.scrollY > 120)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo(0, 0)
  }

  return (
    <>
      <nav className="main-nav">
        <div className="main-nav-left">
          <a href="#" className="scramble"></a>
      </div>
        <div className="main-nav-right">
          <Link to="/">
            <ScrambleText delay={0}>current works</ScrambleText>
          </Link>
          <Link to="/bio">
            <ScrambleText delay={100}>bio</ScrambleText>
          </Link>
          <Link to="/contact">
            <ScrambleText delay={200}>contact</ScrambleText>
          </Link>
      </div>
      </nav>
      {children}
      {showBackToTop && (
        <button id="backToTop" onClick={scrollToTop}>
          ↑ back to top
        </button>
      )}
    </>
  )
}

function Home() {
  const image1Ref = useImageLoader()
  const image2Ref = useImageLoader()
  const image3Ref = useImageLoader()
  const image4Ref = useImageLoader()
  const image5Ref = useImageLoader()
  const image6Ref = useImageLoader()

  return (
    <div className="projects-grid">
      <Link to="/project/1" className="project-link project-live" data-title="diamantista live">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/diamantista-mobile.webp" />
          <source srcSet="/images/diamantista.webp" />
          <img ref={image1Ref} src="/images/diamantista.webp" alt="Project 1" />
        </picture>
        <div className="project-caption">diamantista live</div>
      </Link>
      <Link to="/project/2" className="project-link project-ep" data-title="diamantista - LOVE IS VITAL">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/diamantista%20ep-mobile.webp" />
          <source srcSet="/images/diamantista%20ep.webp" />
          <img ref={image2Ref} src="/images/diamantista%20ep.webp" alt="Project 2" />
        </picture>
        <div className="project-caption">diamantista - LOVE IS VITAL</div>
      </Link>
      <Link to="/project/3" className="project-link project-licitir" data-title="licitir live">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/licitir-mobile.webp" />
          <source srcSet="/images/licitir.webp" />
          <img ref={image3Ref} src="/images/licitir.webp" alt="Project 3" />
        </picture>
        <div className="project-caption">licitir live</div>
      </Link>
      <Link to="/project/4" className="project-link project-licitir-ep" data-title="licitir - Tomorrow we dream of sleeping in a garden of camellias">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/licitir%20ep-mobile.webp" />
          <source srcSet="/images/licitir%20ep.webp" />
          <img ref={image4Ref} src="/images/licitir%20ep.webp" alt="Project 4" />
        </picture>
        <div className="project-caption">LICITIR - Tomorrow we dream of sleeping in a garden of camellias</div>
      </Link>
      <Link to="/project/5" className="project-link project-pastoral" data-title="pastoral live">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/pastoral-mobile.webp" />
          <source srcSet="/images/pastoral.webp" />
          <img ref={image5Ref} src="/images/pastoral.webp" alt="Project 5" />
        </picture>
        <div className="project-caption">.pastoral live</div>
      </Link>
      <Link to="/project/6" className="project-link project-pastoral-ep" data-title="pastoral - Un corazón mustio y marchito por culpa de las tribulaciones y los padecimientos">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/pastoral%20ep-mobile.webp" />
          <source srcSet="/images/pastoral%20ep.webp" />
          <img ref={image6Ref} src="/images/pastoral%20ep.webp" alt="Project 6" />
        </picture>
        <div className="project-caption">.pastoral - Un corazón mustio y marchito por culpa de las tribulaciones y los padecimientos</div>
      </Link>
    </div>
  )
}

function Bio() {
  return (
    <div className="container">
      <div className="element data">
        <h2><ScrambleText delay={0}>general bio</ScrambleText></h2>
        <p>Deterritorialized sound artist. Currently Berlin based.</p>
        <p>A tender, visceral and hallucinatory vaporization of sounds and feelings, an exploration of solitude amidst a hyper connected reality. Voices, guitars, strings, field recordings, electronics, all processed through various audio production techniques and whatever means available, aiming to balance intensity and intimacy, manifest an arcane and elusive sense of beauty within dreamlike sequences, re-imagining the world building potential of metal-adjacent aesthetics through a degendered lens.</p>
        <p>Co-founder of label/platform ruego, theatrical performance unit Anonymous Dreamers and clothing brand Liminal Veil.</p>
        <p>For performance inquiries, soundtrack commissions contact here (diamantistavii@gmail.com)</p>
        <p><strong>Performance highlights include:</strong><br/>
        Diamantista (solo) at Mondi Lontanissimi 2023 (Alcamo), Les Urbaines 2023 (Lausanne), Creepy Teepee 2024 (Kutna Hora), Hinterraum (Berlin), Metal Cave (Warsaw), FLUCC (Vienna) and KLANG (Rome)<br/>
        LICITIR (with Laurén Maria) at OGH 2025 (Berlin)<br/>
        .pastoral (with Gabi Pedrosa) at Les Urbaines 2023 (Lausanne), Creepy Teepee 2024 (Kutna Hora), Vekks (Vienna) , dock.digital (Berlin)</p>
        <p><strong>Other works:</strong><br/>
        Generative audivisual spatial installation as [auloplegma] with Weixin Quek Chong for Continuo at Zapadores (Madrid)<br/>
        Soundtrack as LICITIR for the documentary 'ALMOST A KILLA' by Maurycy Polewski<br/>
        Audio and voice for M. Svitlo and Salt Salomé's video performance (LINK PENDING)<br/>
        Soundtrack and performance for fake_trailer's 'Shapeshifting Hallucination' as .pastoral, with M. Svitlo and Salt Salomé: <a href="https://www.youtube.com/watch?v=iX0uRjRQ9JA&ab_channel=ruegoWW" className="contact-link" target="_blank">link</a></p>
      </div>
      <div className="element data">
        <h2><ScrambleText delay={100}>Diamantista</ScrambleText></h2>
        <br/>
        <p>A metamorphic entity emerging from the rubble, St. Diamantista VII manifests itself between the
        pieces of wreckage and the signals of a solitary lighthouse. A disfigured reinterpretation of
        avant-garde black metal, ambient and power electronics, Diamantista's performance emanates
        from the intimate. As if trapped in an in-between, their atmospheric guitar and vocal tears
        conjure a vivid wound, a distant and confused dream.</p>
        <p><a href="https://diamantistavii.bandcamp.com/" className="contact-link">full discography</a></p>
      </div>
      <div className="element data">
        <h2 id="licitir"><ScrambleText delay={200}>LICITIR</ScrambleText></h2>
        <p>LICITIR is a bond between Laurén Maria and Diamantista, two vocalists and producers whose stylistics leanings are as elusive as they are intuitive, emotional, ever exploring, tender and intense. They shift through cinematic soundscapes that filter gentle melodies through heartfelt corrosion, innocently weaving pop sensibilities forming a dense sonic haze drenched in tearful shards.</p>
      </div>
      <div className="element data">
        <h2 id="pastoral"><ScrambleText delay={300}>.pastoral</ScrambleText></h2>
        <p>The vocal and instrumental panoply of .pastoral is established through an interdisciplinary practice. Composed of ErmenX aka Gabi Pedrosa and St. Diamantista VII, the duo experiments with perspectives. Their eclectic style emerges from bewitched swamps, between heightened indie-folk and post-metal, .pastoral adopts guitars, vocals, drums, sound collage and other instruments to tell narratives that are both tender and grotesque, inhabited by sensitive melodies and desperate incantations.<br/>
        They have released two albums on their label ruego; funeral perpetuo del espíritu (2019) and un corazón mustio y marchito por culpa de las tribulaciones y los padecimientos (2022).</p>
      </div>
    </div>
  )
}

function Contact() {
  return (
    <div className="container">
      <div className="writings-grid">
        <div className="writing-category">
          <div className="element data">
            <h2></h2>
          </div>
          <div className="writing-item">
            <a href="mailto:diamantistavii@gmail.com" className="contact-link">diamantistavii@gmail.com</a>
          </div>
          <div className="writing-item">
            <a href="https://www.instagram.com/prenatal_amygdala/" target="_blank" className="contact-link">@prenatal_amygdala</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Project() {
  const { id } = useParams()
  if (id === '1') {
    return (
      <div className="project-container">
        <h2 className="project-title">
          <ScrambleText delay={0}>diamantista live</ScrambleText>
        </h2>
        <div className="media-container">
          <div className="image-section">
            <img src="/images/diamantista.webp" alt="diamantista live" className="project-image" />
          </div>
          <div className="video-section">
            <video className="project-video" src="/images/diamantista.mov" controls />
          </div>
        </div>
      </div>
    )
  }
  if (id === '2') {
    return (
      <div className="container">
        <div className="element data">
          <h2><ScrambleText delay={0}>diamantista - LOVE IS VITAL</ScrambleText></h2>
          <p>an exercise in solitude, drifting through a recollection of all my mistakes, written on excerpts from the fractured dams that held your mind in place, drinking from the sword that drips your endless bleeding</p>
          <p>honeydew under the morning light, mesmerizing my pitiful gaze</p>
          <p><strong>Released on September 30th, 2024</strong></p>
          <p>St. Diamantista VII - voices, instruments, electronics, borrowing sounds, production, mixing</p>
          <p>Artwork by Salt Salomé and M. Svitlo<br/>Lettering by Alklossien (Katarzyna Brzozowska)</p>
          <p><strong>Mastered by Ludwig Wandinger</strong></p>
          <p><a href="https://ruego.bandcamp.com/album/rg25" className="contact-link" target="_blank">bandcamp</a></p>
          <p><Link to="/project/1" className="contact-link">diamantista live</Link></p>
          <p><Link to="/bio" className="contact-link">diamantista bio</Link></p>
        </div>
        <div className="element data">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/diamantista%20ep-mobile.webp" />
            <source srcSet="/images/diamantista%20ep.webp" />
            <img src="/images/diamantista%20ep.webp" alt="diamantista - LOVE IS VITAL" style={{width:'100%', height:'auto'}} />
          </picture>
        </div>
      </div>
    )
  }
  if (id === '3') {
    return (
      <div className="project-container">
        <h2 className="project-title">
          <ScrambleText delay={0}>LICITIR live</ScrambleText>
        </h2>
        <div className="media-container">
          <div className="image-section">
            <img src="/images/licitir.webp" alt="licitir live" className="project-image" />
          </div>
          <div className="video-section">
            <iframe className="project-video" src="https://www.youtube.com/embed/vF7xEWjdFu0" title="licitir live" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        </div>
      </div>
    )
  }
  if (id === '4') {
    return (
      <div className="container">
        <div className="element data">
          <h2><ScrambleText delay={0}>LICITIR - Tomorrow we dream of sleeping in a garden of camellias</ScrambleText></h2>
          <p><strong>Released on December 23rd, 2024</strong></p>
          <p>Materialized, recorded, arranged, dismantled, produced and mixed in candlelit softness, in a Berlin room during 2024.</p>
          <p><strong>Mastered by Ludwig Wandinger.</strong></p>
          <p><strong>LICITIR</strong> is a bond between Laurén Maria and Diamantista.</p>
          <p>A journey through turmoil, newfound joy, confusion, dissociation, love, and the end of the world.</p>
          <p><strong>Tomorrow we dream of sleeping in a garden of camellias</strong> is a collaborative release between LICITIR and ruego.</p>
          <p><a href="https://ruego.bandcamp.com/album/tomorrow-we-dream-of-sleeping-in-a-garden-of-camellias-rg26" className="contact-link" target="_blank">bandcamp</a></p>
          <p><Link to="/project/3" className="contact-link">LICITIR live</Link></p>
          <p><Link to="/bio#licitir" className="contact-link">LICITIR bio</Link></p>
        </div>
        <div className="element data">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/licitir%20ep-mobile.webp" />
            <source srcSet="/images/licitir%20ep.webp" />
            <img src="/images/licitir%20ep.webp" alt="LICITIR - Tomorrow we dream of sleeping in a garden of camellias" style={{width:'100%', height:'auto'}} />
          </picture>
        </div>
      </div>
    )
  }
  if (id === '5') {
    return (
      <div className="project-container">
        <h2 className="project-title">
          <ScrambleText delay={0}>.pastoral live</ScrambleText>
        </h2>
        <div className="media-container">
          <div className="image-section">
            <img src="/images/pastoral.webp" alt="pastoral live" className="project-image" />
          </div>
          <div className="video-section">
            <iframe className="project-video" 
              src="https://www.youtube.com/embed/WtsBI93REOU?start=2748"
              frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
            </iframe>
          </div>
        </div>
      </div>
    )
  }
  if (id === '6') {
    return (
      <div className="container">
        <div className="element data">
          <h2><ScrambleText delay={0}>.pastoral - Un corazón mustio y marchito por culpa de las tribulaciones y los padecimientos</ScrambleText></h2>
          <p>A fool thought to emerge from such a magnum fracture in the timespace continuum unscathed. There are still trials to face and the body will soon enough give in.</p>
          <p>Be our esteemed companion, sweeping through the perils of a withered heart, through confusion, desolation, fracture, but also through the joy of discovery, the promise of contentment with oneself.</p>
          <p>The world was never ours, never satiated no matter how big the sacrifice. Leaves fall, leaving the heart naked once again.</p>
          <p><strong>Released on October 7th, 2022</strong></p>
          <p>Instruments, voices, and arrangements were composed, performed, recorded, and assembled between 2019 and 2021 in Warsaw, Szczyrk, and Berlin by ErmenX and St. Diamantista VII.</p>
          <p>Saxophones in tracks 'Blanco Hueso' and 'Los Mismos Santos' by Gustavo Obligado.</p>
          <p>Mixing and engineering by 47_N_74D0.</p>
          <p>Cover art painting commission by Jan Eustachy Wolski (courtesy of Piktogram Gallery, <a href="http://www.piktogram.org" className="contact-link" target="_blank">www.piktogram.org</a>).</p>
          <p>Mastering and additional graphic design by ErmenX.</p>
          <p>Video editing for 'De qué sirve rogar' by St. Diamantista (<a href="https://www.youtube.com/watch?v=5JE9YOWjzv8" className="contact-link" target="_blank">watch video</a>).</p>
          <p><strong>Un coraz​ó​n mustio y marchito por culpa de las tribulaciones y los padecimientos</strong> is a collaborative release between Most Dismal Swamp and ruego.</p>
          <p><a href="http://www.mostdismalswamp.com" className="contact-link" target="_blank">www.mostdismalswamp.com</a></p>
          <p><a href="https://ruego.bandcamp.com/album/un-coraz-n-mustio-y-marchito-por-culpa-de-las-tribulaciones-y-los-padecimientos-rg19" className="contact-link" target="_blank">bandcamp</a></p>
          <p><Link to="/project/5" className="contact-link">.pastoral live</Link></p>
          <p><Link to="/bio#pastoral" className="contact-link">.pastoral bio</Link></p>
        </div>
        <div className="element data">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/pastoral%20ep-mobile.webp" />
            <source srcSet="/images/pastoral%20ep.webp" />
            <img src="/images/pastoral%20ep.webp" alt=".pastoral - Un corazón mustio y marchito" style={{width:'100%', height:'auto'}} />
          </picture>
        </div>
      </div>
    )
  }
  return null
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bio" element={<Bio />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/project/:id" element={<Project />} />
      </Routes>
    </Layout>
  )
}
