import { useCallback, useEffect, useState } from 'react';
import { LiveGameEditor } from './features/editor/LiveGameEditor';
import { SceneInspector } from './features/editor/SceneInspector';
import { LobbyPage } from './features/lobby/LobbyPage';
import { GameHUD } from './features/sandbox/components/GameHUD';
import { PublishModal } from './features/sandbox/components/PublishModal';
import { SandboxViewport } from './features/sandbox/components/SandboxViewport';
import { SpeedEffects } from './features/sandbox/components/SpeedEffects';
import { StudioCopilotBar } from './features/sandbox/components/StudioCopilotBar';
import { TouchControls } from './features/sandbox/components/TouchControls';
import { useGameStore } from './features/sandbox/store/useGameStore';
import { fetchGameById, fetchGames, generateGameStream, recordGamePlay } from './shared/api/gameApi';
import { useTheme } from './shared/hooks/useTheme';

const getPlayIdFromPath = () => {
  const match = window.location.pathname.match(/^\/play\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

export function App() {
  const { theme, toggleTheme } = useTheme();
  const currentGame = useGameStore((s) => s.currentGame);
  const isLoading = useGameStore((s) => s.isLoading);
  const setGame = useGameStore((s) => s.setGame);
  const setLoading = useGameStore((s) => s.setLoading);
  const setEditorOpen = useGameStore((s) => s.setEditorOpen);

  const [games, setGames] = useState([]);
  const [isFetchingGames, setIsFetchingGames] = useState(true);
  const [buildStage, setBuildStage] = useState(null);
  const [error, setError] = useState('');

  const loadRecentGames = useCallback(async () => {
    setIsFetchingGames(true);
    try { setGames(await fetchGames()); } catch { setGames([]); } finally { setIsFetchingGames(false); }
  }, []);

  const openGame = useCallback((game, pushUrl = true) => {
    setError('');
    setGame(game);
    if (game?.id) recordGamePlay(game.id).catch(() => {});
    if (pushUrl && game?.id) window.history.pushState({}, '', `/play/${game.id}`);
  }, [setGame]);

  const handleBackToLobby = useCallback(() => {
    setError('');
    setEditorOpen(false); setGame(null);
    window.history.pushState({}, '', '/');
    loadRecentGames();
  }, [setEditorOpen, setGame, loadRecentGames]);

  useEffect(() => {
    const syncFromUrl = async () => {
      const playId = getPlayIdFromPath();
      if (playId) {
        setLoading(true);
        try {
          const fetched = await fetchGameById(playId);
          if (!fetched?.game_config) throw new Error('Invalid game');
          openGame(fetched, false);
        } catch {
          window.history.replaceState({}, '', '/');
          setGame(null);
        } finally {
          setLoading(false);
        }
      } else {
        setGame(null);
      }
      loadRecentGames();
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [loadRecentGames, openGame, setGame, setLoading]);

  const handleGenerate = async (prompt, dimension = '3d') => {
    setError('');
    setLoading(true);
    setBuildStage({ step: 1, total: 3, label: `1/3 Designing ${dimension === '2d' ? '2D arcade' : '3D world'} rules & mechanics...` });
    try {
      const game = await generateGameStream(prompt, (progress) => setBuildStage(progress), dimension);
      setBuildStage({ step: 3, total: 3, label: '3/3 Compiling & launching...' });
      openGame(game, true);
    } catch (err) {
      setError(err.message || 'Failed to generate world.');
    } finally {
      setLoading(false);
      setBuildStage(null);
    }
  };

  if (currentGame) {
    return (
      <div className="relative w-screen h-screen bg-[#E8DFD5] overflow-hidden">
        <SandboxViewport onBackToLobby={handleBackToLobby} />
        <SpeedEffects />
        <GameHUD onBackToLobby={handleBackToLobby} />
        <TouchControls />
        <StudioCopilotBar theme={theme} />
        <SceneInspector />
        <PublishModal />
        <LiveGameEditor />
      </div>
    );
  }

  return (
    <LobbyPage
      theme={theme}
      toggleTheme={toggleTheme}
      games={games}
      isFetchingGames={isFetchingGames}
      isLoading={isLoading}
      buildStage={buildStage}
      error={error}
      onClearError={() => setError('')}
      onGenerate={handleGenerate}
      onPlayGame={(game) => openGame(game, true)}
      onRemixGame={(game) => { openGame(game, true); setEditorOpen(true); }}
    />
  );
}

export default App;
