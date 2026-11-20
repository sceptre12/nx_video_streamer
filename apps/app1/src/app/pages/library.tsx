import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLibrary, LibraryVideo } from '../api';
import { useSession } from '../components/session';
import { Player } from './player';

export function LibraryPage() {
  const [videos, setVideos] = useState<LibraryVideo[] | null>(null);
  const [selected, setSelected] = useState<LibraryVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, logout, logoutError, setUser } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getLibrary().then(({ data, error: err }) => {
      if (!active) return;
      if (err) {
        if ((err as { status?: number }).status === 401) setUser(null);
        else setError(err.message);
        return;
      }
      setVideos(data ?? []);
    });
    return () => {
      active = false;
    };
  }, [setUser]);

  return (
    <div className="container mx-auto">
      <h1>Library</h1>
      <p>Signed in as {user?.username}</p>
      <button onClick={() => navigate('/webcam')}>Webcam</button>
      <button onClick={() => logout()}>Log out</button>
      {error && <p role="alert">{error}</p>}
      {logoutError && <p role="alert">{logoutError}</p>}
      {videos && videos.length === 0 && <p>No videos yet.</p>}
      <ul>
        {videos?.map((v) => (
          <li key={v.video_id}>
            <button onClick={() => setSelected(v)}>{v.title}</button>
          </li>
        ))}
      </ul>
      {selected && <Player video={selected} />}
    </div>
  );
}

export default LibraryPage;
