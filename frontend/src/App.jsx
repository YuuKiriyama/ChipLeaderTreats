import { useState, useEffect } from 'react';
import HostView from './views/HostView';
import GuestView from './views/GuestView';
import HistoryView from './views/HistoryView';
import { getGuestSession, getGameState, getActiveRole, clearActiveRole, clearGuestSession, clearGameState } from './utils/localStorage';
import { Icons } from './components/Icons';

function getRoute() {
  const hash = window.location.hash || '';
  const match = hash.match(/^#\/join\/(.+)$/);
  if (match) return { page: 'join', hostPeerId: match[1] };
  if (hash === '#/history') return { page: 'history' };
  return { page: 'home' };
}

function AppRouter() {
  const [route, setRoute] = useState(getRoute);
  const [mode, setMode] = useState(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const onHashChange = () => {
      const r = getRoute();
      setRoute(r);
      if (r.page === 'join') setMode('guest');
      else if (r.page === 'history') setMode('history');
      else setMode(null);
    };
    window.addEventListener('hashchange', onHashChange);

    const initial = getRoute();
    if (initial.page === 'join') setMode('guest');
    else if (initial.page === 'history') setMode('history');

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (mode === 'guest' || route.page === 'join') {
    return <GuestView hostPeerId={route.hostPeerId} onExit={() => { window.location.hash = ''; setMode(null); }} />;
  }

  if (mode === 'history' || route.page === 'history') {
    return <HistoryView onBack={() => { window.location.hash = ''; setMode(null); }} />;
  }

  if (mode === 'host-new') {
    return <HostView isResume={false} onExit={() => setMode(null)} />;
  }

  if (mode === 'host-resume') {
    return <HostView isResume={true} onExit={() => setMode(null)} />;
  }

  // Home screen
  const role = getActiveRole();
  const savedGame = getGameState();
  const savedGuest = getGuestSession();

  const showHostResume = savedGame && savedGame.gameStatus !== 'ended' && role !== 'guest';
  const showGuestResume = savedGuest && role !== 'host';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4 pt-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 text-green-600">
            <Icons.DollarSign />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">ChipLeaderTreats</h1>
          <p className="text-gray-500 mt-2">Poker Score Tracker</p>
        </div>

        <div className="space-y-3">
          {showHostResume && (
            <button
              onClick={() => setMode('host-resume')}
              className="w-full py-4 bg-yellow-500 text-white rounded-xl text-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-6 h-6"><Icons.Play /></span>
              Resume Game (Host)
            </button>
          )}

          {showGuestResume && (
            <button
              onClick={() => {
                window.location.hash = `#/join/${savedGuest.hostPeerId}`;
              }}
              className="w-full py-4 bg-blue-500 text-white rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="w-6 h-6"><Icons.User /></span>
              Rejoin Game (Guest)
            </button>
          )}

          <button
            onClick={() => setMode('host-new')}
            className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="w-6 h-6"><Icons.Plus /></span>
            Create New Game
          </button>

          <button
            onClick={() => setMode('history')}
            className="w-full py-4 bg-white text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2"
          >
            <span className="w-6 h-6"><Icons.History /></span>
            Game History
          </button>

          {/* Clear stale sessions */}
          {(showHostResume || showGuestResume) && (
            <button
              onClick={() => {
                if (!confirm('Clear saved session? You will not be able to resume.')) return;
                clearGameState();
                clearGuestSession();
                clearActiveRole();
                forceUpdate((c) => c + 1);
              }}
              className="w-full py-2 text-gray-400 text-xs hover:text-gray-600 transition-colors"
            >
              Clear Saved Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppRouter;
