import AssistantSidebar from './AssistantSidebar';
import './site.css';

export default function RealEstateApp() {
  return (
    <div className="re-shell">
      <main className="re-main" style={{ 
        padding: 0, 
        height: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'stretch'
      }}>
        <iframe 
          src="https://www.fortius.consulting/" 
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            display: 'block',
            background: '#ffffff'
          }}
          title="Fortius Consulting"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
        />
      </main>
      <aside className="re-right">
        <AssistantSidebar />
      </aside>
    </div>
  );
}
