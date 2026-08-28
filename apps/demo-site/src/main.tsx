import { BUILT_IN_THEMES } from '@pretend-terminal/core';
import { PretendTerminal } from '@pretend-terminal/react';
import { createRoot } from 'react-dom/client';

import '@pretend-terminal/react/styles.css';
import './style.css';

void PretendTerminal;

function App() {
  return (
    <main>
      <h1>Pretend Terminal demo</h1>
      <p>Foundation ready with {Object.keys(BUILT_IN_THEMES).length} published themes.</p>
    </main>
  );
}

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('The demo site is missing its React root.');
}

createRoot(rootElement).render(<App />);
