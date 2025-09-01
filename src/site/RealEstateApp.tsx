import AssistantSidebar from './AssistantSidebar';
import './site.css';

function Nav() {
  return (
    <header className="re-nav">
      <div className="brand">Aurora Estates</div>
      <nav>
        <a href="#listings">Buy</a>
        <a href="#listings">Rent</a>
        <a href="#listings">New Launches</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="re-hero">
      <h1>Find your next home</h1>
      <p>Premium properties, trusted agents, modern financing — all in one place.</p>
      <div className="re-search">
        <input placeholder="City, address, or ZIP" />
        <input placeholder="Min Price" />
        <input placeholder="Max Price" />
        <button>Search</button>
      </div>
    </section>
  );
}

function Card({ title, subtitle, img }: { title: string; subtitle: string; img: string }) {
  return (
    <div className="re-card">
      <div className="img" style={{ backgroundImage: `url(${img})` }} />
      <div className="info">
        <div className="title">{title}</div>
        <div className="sub">{subtitle}</div>
      </div>
    </div>
  );
}

export default function RealEstateApp() {
  return (
    <div className="re-shell">
      <main className="re-main">
        <div className="re-pane">
          <Nav />
          <Hero />
          <section id="listings" className="re-section">
          <h2>Featured Listings</h2>
          <div className="re-grid">
            <Card title="Modern Loft" subtitle="$820,000 • SoMa, SF" img="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop" />
            <Card title="Lakeview Villa" subtitle="$2,400,000 • Lake Tahoe" img="https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1400&auto=format&fit=crop" />
            <Card title="Downtown Condo" subtitle="$640,000 • Seattle" img="https://images.unsplash.com/photo-1502005229762-cf1b2da7c55a?q=80&w=1400&auto=format&fit=crop" />
            <Card title="Coastal Retreat" subtitle="$1,750,000 • Santa Barbara" img="https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400&auto=format&fit=crop" />
          </div>
        </section>
        <section id="neighborhoods" className="re-section">
          <h2>Neighborhood Guides</h2>
          <p>Explore schools, commute, restaurants, and parks — ask the assistant to compare areas.</p>
          <div className="re-grid re-grid-3">
            <Card title="Willow Park" subtitle="Family-friendly • Great schools" img="https://images.unsplash.com/photo-1465804575741-338df8554e7c?q=80&w=1400&auto=format&fit=crop" />
            <Card title="Harbor Point" subtitle="Waterfront • Nightlife" img="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1400&auto=format&fit=crop" />
            <Card title="Midtown" subtitle="Urban living • Walkable" img="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1400&auto=format&fit=crop" />
          </div>
        </section>
        <section id="agents" className="re-section re-agents">
          <h2>Meet Our Agents</h2>
          <div className="re-grid re-grid-3">
            <div className="re-agent"><div className="avatar" /> <div><strong>Alex Rivera</strong><div>Luxury, Bay Area</div></div></div>
            <div className="re-agent"><div className="avatar" /> <div><strong>Maya Chen</strong><div>New Developments</div></div></div>
            <div className="re-agent"><div className="avatar" /> <div><strong>Daniel Brooks</strong><div>Waterfront Homes</div></div></div>
          </div>
        </section>
        <section id="contact" className="re-cta">
          <div>
            <h3>Ready to tour a property?</h3>
            <p>Ask the assistant to schedule a viewing, or leave your details and we’ll reach out.</p>
          </div>
          <button>Get in touch</button>
        </section>
        <footer className="re-footer">© {new Date().getFullYear()} Aurora Estates • Equal Housing Opportunity</footer>
        </div>
      </main>
      <aside className="re-right">
        <AssistantSidebar />
      </aside>
    </div>
  );
}
