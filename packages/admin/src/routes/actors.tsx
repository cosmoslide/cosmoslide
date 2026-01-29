import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { adminAPI, Actor } from '../lib/api';
import Layout from '../components/Layout';

export const Route = createFileRoute('/actors')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        throw redirect({ to: '/login' });
      }
    }
  },
  component: ActorsPage,
});

function ActorsPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<boolean | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [syncingActorId, setSyncingActorId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [actorUrl, setActorUrl] = useState('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchActors();
  }, [page, filter]);

  const fetchActors = async () => {
    const result = await adminAPI.getActors(page, 20, filter);
    if (!result.ok) {
      switch (result.error.type) {
        case 'UNAUTHORIZED':
          // handled by interceptor
          break;
        case 'NETWORK':
          console.error(`Network error: ${result.error.status}`);
          break;
      }
      setLoading(false);
      return;
    }
    setActors(result.value.data);
    setTotal(result.value.meta.total);
    setLoading(false);
  };

  const handleSyncActor = async (actorId: string) => {
    if (!confirm('Sync this actor?')) {
      return;
    }

    setSyncingActorId(actorId);
    const result = await adminAPI.syncActor(actorId);
    if (!result.ok) {
      switch (result.error.type) {
        case 'NOT_FOUND':
          alert('Actor not found.');
          break;
        case 'NETWORK':
          alert(`Failed to sync actor: ${result.error.message}`);
          break;
      }
      setSyncingActorId(null);
      return;
    }
    alert('Actor synced successfully.');
    await fetchActors();
    setSyncingActorId(null);
  };

  const handleSyncAllLocalActors = async () => {
    if (!confirm('Sync all local actors?')) {
      return;
    }

    setSyncingAll(true);
    const result = await adminAPI.syncAllLocalActors();
    if (!result.ok) {
      switch (result.error.type) {
        case 'NETWORK':
          alert(`Failed to sync actors: ${result.error.message}`);
          break;
      }
      setSyncingAll(false);
      return;
    }
    let message = `${result.value.synced} actors synced.`;
    if (result.value.errors && result.value.errors.length > 0) {
      message += `\n\nErrors:\n${result.value.errors.join('\n')}`;
    }
    alert(message);
    await fetchActors();
    setSyncingAll(false);
  };

  const handleFetchActor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actorUrl.trim()) {
      alert('Please enter an ActivityPub URL.');
      return;
    }

    setFetching(true);
    const result = await adminAPI.fetchAndPersistActor(actorUrl);
    if (!result.ok) {
      switch (result.error.type) {
        case 'VALIDATION':
          alert(`Invalid input: ${result.error.message}`);
          break;
        case 'NOT_FOUND':
          alert('Actor not found.');
          break;
        case 'NETWORK':
          alert(`Failed to fetch actor: ${result.error.message}`);
          break;
        case 'UNKNOWN':
          alert(`Unknown error: ${result.error.cause.message}`);
          break;
        default:
          alert('Failed to fetch actor.');
      }
      setFetching(false);
      return;
    }
    alert(
      `Actor fetched successfully: ${result.value.actor.preferredUsername}`,
    );
    setActorUrl('');
    await fetchActors();
    setFetching(false);
  };

  if (loading)
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          Actors
        </h1>

        {/* Fetch Actor Form */}
        <form
          onSubmit={handleFetchActor}
          style={{
            marginBottom: '1rem',
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              htmlFor="actorUrl"
              style={{ fontWeight: '600', whiteSpace: 'nowrap' }}
            >
              Fetch Remote Actor:
            </label>
            <input
              id="actorUrl"
              type="text"
              value={actorUrl}
              onChange={(e) => setActorUrl(e.target.value)}
              placeholder="https://mastodon.social/@username"
              disabled={fetching}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
            <button
              type="submit"
              disabled={fetching}
              style={{
                padding: '0.5rem 1rem',
                background: fetching ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: fetching ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                whiteSpace: 'nowrap',
              }}
            >
              {fetching ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
        </form>

        {/* Actions and Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSyncAllLocalActors}
              disabled={syncingAll}
              style={{
                padding: '0.5rem 1rem',
                background: syncingAll ? '#ccc' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: syncingAll ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              {syncingAll ? 'Syncing...' : 'Sync All Local Actors'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilter(undefined)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === undefined ? '#667eea' : '#e5e7eb',
                color: filter === undefined ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter(true)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === true ? '#667eea' : '#e5e7eb',
                color: filter === true ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Local
            </button>
            <button
              onClick={() => setFilter(false)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === false ? '#667eea' : '#e5e7eb',
                color: filter === false ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Remote
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowX: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '1200px',
          }}
        >
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Actor ID</th>
              <th style={thStyle}>Acct</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Display Name</th>
              <th style={thStyle}>Domain</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Followers</th>
              <th style={thStyle}>Following</th>
              <th style={thStyle}>Local User</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actors.map((actor) => (
              <tr key={actor.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={actor.id}
                >
                  {actor.id.substring(0, 8)}...
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {actor.actorId ? (
                    <a
                      href={actor.actorId}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea', textDecoration: 'none' }}
                    >
                      {actor.actorId.substring(0, 30)}...
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                  {actor.acct || '-'}
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                  }}
                >
                  {actor.preferredUsername}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                  {actor.name || '-'}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                  {actor.domain}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: actor.isLocal ? '#d4edda' : '#f8d7da',
                      color: actor.isLocal ? '#155724' : '#721c24',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {actor.isLocal ? 'Local' : 'Remote'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                >
                  {actor.followersCount.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                >
                  {actor.followingCount.toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {actor.user ? (
                    <span style={{ color: '#667eea', fontWeight: '500' }}>
                      {actor.user.username}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(actor.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                  {actor.isLocal && (
                    <button
                      onClick={() => handleSyncActor(actor.id)}
                      disabled={syncingActorId === actor.id}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background:
                          syncingActorId === actor.id ? '#ccc' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor:
                          syncingActorId === actor.id
                            ? 'not-allowed'
                            : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      {syncingActorId === actor.id ? 'Syncing...' : 'Sync'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: '0.5rem 1rem',
            background: page === 1 ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <span style={{ padding: '0.5rem 1rem' }}>
          Page {page} ({total} total actors)
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={actors.length < 20}
          style={{
            padding: '0.5rem 1rem',
            background: actors.length < 20 ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: actors.length < 20 ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </Layout>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};
