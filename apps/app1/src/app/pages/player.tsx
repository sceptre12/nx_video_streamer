import { LibraryVideo } from '../api';

/** The video src is the item's relative stream_url, never an absolute host URL. */
export function Player({ video }: { video: LibraryVideo }) {
  return (
    <div>
      <h2>{video.title}</h2>
      <video data-testid="player" controls autoPlay src={video.stream_url}></video>
    </div>
  );
}

export default Player;
