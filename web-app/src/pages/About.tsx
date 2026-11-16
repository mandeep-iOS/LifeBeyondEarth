import { ExternalLink, BookOpen } from 'lucide-react'
import { PageHeader, Card } from '../components/ui'
import ProjectBriefing from '../components/ProjectBriefing'

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="About LifeBeyondEarth" 
        subtitle="Explore planetary environments, biological systems, and mission survival simulation."
      />

      {/* Project Briefing with video */}
      <ProjectBriefing />

      {/* A. Project Concept & Overview */}
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Project Concept</h2>
          <p className="text-lg text-gray-300 max-w-3xl">
            LifeBeyondEarth is an interactive simulation platform that explores the scientific and engineering challenges of sustaining human life and biological systems on other worlds.
          </p>
        </div>
        
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
            <p className="text-gray-300 leading-relaxed">
              Human space exploration and off-world habitat development require understanding how life systems interact with alien environments. Long-term sustainability on extreme and distant worlds demands balancing competing engineering constraints: power generation, thermal control, water recycling, radiation shielding, and autonomous decision-making under resource scarcity.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">What LifeBeyondEarth Simulates</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex gap-3"><span className="text-ios-blue">→</span> Planetary survival constraints (temperature, radiation, water availability, atmospheric composition)</li>
              <li className="flex gap-3"><span className="text-ios-blue">→</span> Biological system requirements and tolerances under off-world conditions</li>
              <li className="flex gap-3"><span className="text-ios-blue">→</span> Habitat engineering, power systems, and environmental control lifecycle systems (ECLSS)</li>
              <li className="flex gap-3"><span className="text-ios-blue">→</span> Autonomous robot decision-making for mission-critical scenarios</li>
              <li className="flex gap-3"><span className="text-ios-blue">→</span> Knowledge accumulation from past missions to inform future predictions</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">What You Can Explore</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex gap-3"><span className="text-ios-green">✓</span> Planetary data for dozens of worlds: near-Earth bodies, extreme environments, exoplanet candidates</li>
              <li className="flex gap-3"><span className="text-ios-green">✓</span> Crop research from NASA and international space programs with documented spaceflight heritage</li>
              <li className="flex gap-3"><span className="text-ios-green">✓</span> 30-day mission simulations with autonomous robot caretaker management</li>
              <li className="flex gap-3"><span className="text-ios-green">✓</span> Real NASA data: POWER climate data, Exoplanet Archive, GeneLab spaceflight research, DONKI space weather</li>
              <li className="flex gap-3"><span className="text-ios-green">✓</span> Mission reports, survival analysis, and robot decision logs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* B. How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <Card className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">1</span> Select a Planetary Environment</h4>
            <p className="text-gray-300 ml-8">Choose a destination: near-Earth worlds (Mars, Moon), extreme environments (Venus, gas giants), or distant exoplanet candidates from the Exoplanet Archive.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">2</span> Select a Biological System</h4>
            <p className="text-gray-300 ml-8">Pick a bio-regeneration crop with documented spaceflight research. Plants are categorized by cultivation requirements: outside-dome trials or pressurized bio-dome farming.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">3</span> Complete Survival Preparation</h4>
            <p className="text-gray-300 ml-8">Review the survival prediction. The system uses a trained machine-learning model (Ridge or Gradient Boosting regressor) to predict mission difficulty based on environmental constraints, biological tolerances, and patterns from past missions.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">4</span> Explore Advanced Tools</h4>
            <p className="text-gray-300 ml-8">Access specialist systems: Bio-Dome Lab for crop directives, Power Grid for energy management, Habitat Engineering for structural design, and Mission Memory for historical analysis.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">5</span> Run a Mission Simulation</h4>
            <p className="text-gray-300 ml-8">Launch a 30+ day simulation. Watch the autonomous robot caretaker manage power, water, thermal control, and crop health under realistic environmental stresses.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-ios-blue flex items-center gap-2"><span className="inline-block bg-ios-blue/25 px-2 py-0.5 rounded text-sm">6</span> Review Mission Report & History</h4>
            <p className="text-gray-300 ml-8">Analyze outcomes, survival probability, robot decisions, and threats encountered. Save mission results to build history and inform future predictions.</p>
          </div>
        </Card>
      </section>

      {/* C. Core Systems */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Core Systems</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold mb-2">Planetary Environment Selection</h3>
            <p className="text-sm text-gray-300">
              Browse real planetary data: temperature, radiation, water availability, atmospheric composition, and habitability status. Explore Earth analogs, terrestrial worlds, gas giants, and exoplanet candidates with evidence-based classifications.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Biological Systems & Bio-Dome Lab</h3>
            <p className="text-sm text-gray-300">
              Select from crops with documented spaceflight research (NASA Veggie, GeneLab OSDR). Issue directives to the autonomous Bio-Dome system and observe environmental adaptation and crop management strategies.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Survival Preparation</h3>
            <p className="text-sm text-gray-300">
              The survival prediction engine uses a machine-learning model trained on physics-generated samples and real mission history to calculate mission difficulty and survival probability based on environmental constraints, biological system requirements, and patterns learned from past missions.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Mission Simulation</h3>
            <p className="text-sm text-gray-300">
              Run detailed day-by-day simulations. Track crop health, power budgets, water recycling, thermal control, radiation exposure, and autonomous robot decisions across 30+ simulated days.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Power & ECLSS Grid</h3>
            <p className="text-sm text-gray-300">
              Manage autonomous energy distribution: solar charging, thermal control, water electrolysis for oxygen production, CO₂ scrubbing (Sabatier reaction), and emergency reserve allocation.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Habitat Engineering</h3>
            <p className="text-sm text-gray-300">
              Design robot morphing strategies, radiation shielding, structural integrity, and life-support balance. Explore signal latency and autonomous decision-making levels for different mission distances.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Mission Memory</h3>
            <p className="text-sm text-gray-300">
              The system retains mission outcomes: survival scores, robot actions, environmental threats, and lessons learned. Past missions inform future predictions through rule-based adaptation weights.
            </p>
          </Card>
        </div>
      </section>

      {/* D. Technology Stack */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Technology Stack</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold mb-3">Frontend</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li><strong>React</strong> - UI framework</li>
              <li><strong>TypeScript</strong> - Type safety</li>
              <li><strong>Tailwind CSS</strong> - Styling</li>
              <li><strong>Vite</strong> - Build tool</li>
              <li><strong>React Router</strong> - Navigation</li>
              <li><strong>Lucide Icons</strong> - Icon library</li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">Backend & Data</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li><strong>FastAPI</strong> - REST API framework</li>
              <li><strong>Python</strong> - Backend language</li>
              <li><strong>SQLite</strong> - Mission history & memory persistence</li>
              <li><strong>NumPy</strong> - Numerical computations</li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">External APIs & Data</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li><strong>NASA POWER</strong> - Climate and solar irradiance data</li>
              <li><strong>NASA Exoplanet Archive</strong> - Exoplanet candidates</li>
              <li><strong>NASA GeneLab OSDR</strong> - Plant spaceflight research</li>
              <li><strong>NASA DONKI</strong> - Space weather alerts</li>
              <li><strong>NASA Mars Rover API</strong> - Curiosity rover imagery</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* E. Scientific References */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Scientific References</h2>
        
        <div className="space-y-3">
          <Card className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">NASA GeneLab: Open Science Data Repository</h4>
                <p className="text-sm text-gray-400">NASA</p>
                <p className="text-sm text-gray-300 mt-1">Provides publicly accessible spaceflight research data on plant biology, microgravity effects, and space-grown crop studies. Referenced for crop selection and survival parameters.</p>
              </div>
              <a href="https://genelab.nasa.gov/" target="_blank" rel="noopener noreferrer" className="ml-2 text-ios-blue hover:text-ios-blue/80 flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">NASA POWER (Prediction Of Worldwide Energy Resources)</h4>
                <p className="text-sm text-gray-400">NASA LARC</p>
                <p className="text-sm text-gray-300 mt-1">Global climate and solar irradiance data. Provides temperature, precipitation, and solar flux data used in mission simulations and planetary comparisons.</p>
              </div>
              <a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener noreferrer" className="ml-2 text-ios-blue hover:text-ios-blue/80 flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">NASA Exoplanet Archive</h4>
                <p className="text-sm text-gray-400">NASA IPAC/Caltech</p>
                <p className="text-sm text-gray-300 mt-1">Confirmed exoplanet data and habitability-zone classifications. Used to populate distant world exploration scenarios.</p>
              </div>
              <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noopener noreferrer" className="ml-2 text-ios-blue hover:text-ios-blue/80 flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">NASA DONKI: Space Weather Database</h4>
                <p className="text-sm text-gray-400">NASA NOAA</p>
                <p className="text-sm text-gray-300 mt-1">Solar flare and space weather event data. Informs radiation threat levels and emergency scenarios in missions.</p>
              </div>
              <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener noreferrer" className="ml-2 text-ios-blue hover:text-ios-blue/80 flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">NASA Mars Rover API</h4>
                <p className="text-sm text-gray-400">NASA JPL</p>
                <p className="text-sm text-gray-300 mt-1">Real rover imagery from Curiosity and Perseverance rovers. Provides environmental context for Mars-based mission simulations.</p>
              </div>
              <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="ml-2 text-ios-blue hover:text-ios-blue/80 flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
          </Card>
        </div>
      </section>

      {/* F. Scientific Scope & Limitations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Scientific Scope & Limitations</h2>
        
        <Card className="space-y-3 border-l-4 border-ios-orange">
          <h3 className="text-lg font-semibold">Prototype & Exploratory Simulation</h3>
          <p className="text-gray-300">
            LifeBeyondEarth is an educational prototype designed to explore mission-survival scenarios. It is not a validated spacecraft life-support system, certified for mission planning, or approved for operational use.
          </p>
          
          <h3 className="text-lg font-semibold mt-4">Simulation Outputs</h3>
          <p className="text-gray-300">
            Survival predictions and mission reports are estimates based on simplified models. They do not represent proof of real-world mission readiness, NASA validation, or confirmed planetary habitability.
          </p>

          <h3 className="text-lg font-semibold mt-4">Scientific Assumptions & Model Limitations</h3>
          <ul className="space-y-2 text-gray-300 list-disc list-inside">
            <li>Planetary data is derived from public sources and may not reflect all environmental variables</li>
            <li>Crop survival parameters are based on documented spaceflight research but represent laboratory conditions, not actual mission outcomes</li>
            <li>Power management, thermal control, and water recycling systems are modeled with significant simplifications</li>
            <li>Survival predictions are generated by scikit-learn regression models (Ridge, GradientBoosting) trained on physics-based synthetic data and real mission history, not physics-based simulations</li>
            <li>Exoplanet habitability is classification-based only; habitable-zone designation does not confirm actual habitability</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">System Applicability</h3>
          <p className="text-gray-300">
            Individual system capabilities are described according to their implementation:
          </p>
          <ul className="space-y-2 text-gray-300 list-disc list-inside">
            <li><strong>Prediction Engine:</strong> Supervised learning models (Ridge/GradientBoosting regressors) trained on synthetic and real mission samples. Retrained when history changes.</li>
            <li><strong>Mission Memory:</strong> Stores historical mission data in SQLite. Uses data to generate training samples for prediction model. No semantic retrieval or large language models.</li>
            <li><strong>Autonomous Robot:</strong> Simulates decision-making under constraints using rule-based logic. Not a production autonomy system.</li>
            <li><strong>Life-Support Systems:</strong> Models simplified energy, water, and thermal balance. Real systems are far more complex.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">Not Included</h3>
          <p className="text-gray-300">
            This application does not include live NASA integration, real-time orbital mechanics, validated medical protocols, radiation transport physics, or certified safety systems.
          </p>
        </Card>
      </section>

      <div className="flex gap-3">
        <a href="https://github.com/deepbaath/LifeBeyondEarth" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ios-blue hover:text-ios-blue/80">
          <BookOpen size={16} /> View Source Code
        </a>
      </div>
    </div>
  )
}
