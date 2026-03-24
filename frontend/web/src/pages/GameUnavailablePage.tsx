import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout.js';

export function GameUnavailablePage() {
  const { unsupportedGameId } = useParams();

  return (
    <Layout title="Game unavailable" showBack>
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-800">This game is not available.</h1>
          <p className="text-slate-500 mt-3">
            The route you opened is not currently approved or supported in this build.
          </p>
          {unsupportedGameId && (
            <p className="text-sm text-slate-400 mt-2">
              Requested game: <span className="font-mono">{unsupportedGameId}</span>
            </p>
          )}
          <Link to="/" className="btn-primary inline-flex mt-6">
            Return to library
          </Link>
        </div>
      </div>
    </Layout>
  );
}
