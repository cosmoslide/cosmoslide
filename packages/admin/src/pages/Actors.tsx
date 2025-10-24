import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import Layout from '../components/Layout';

interface Actor {
  id: string;
  actorId: string;
  iri?: string;
  acct?: string;
  preferredUsername: string;
  name: string;
  summary?: string;
  url?: string;
  icon?: {
    type: string;
    mediaType?: string;
    url: string;
  };
  image?: {
    type: string;
    mediaType?: string;
    url: string;
  };
  inboxUrl?: string;
  outboxUrl?: string;
  sharedInboxUrl?: string;
  followersUrl?: string;
  followingUrl?: string;
  manuallyApprovesFollowers: boolean;
  type: string;
  domain: string;
  isLocal: boolean;
  userId: string | null;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
  lastFetchedAt?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export default function Actors() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<boolean | undefined>(undefined);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchActors();
  }, [page, filter]);

  const fetchActors = async () => {
    try {
      const response = await adminAPI.getActors(page, 20, filter);
      setActors(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch actors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Actors</h1>

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

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '2400px' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Actor ID / IRI / URL</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Acct</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Display Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Summary</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Domain</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Actor Type</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Icon</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Image</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Private</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Inbox</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Outbox</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Shared Inbox</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Followers URL</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Following URL</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Followers</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Following</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Local User</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Updated</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Last Fetched</th>
            </tr>
          </thead>
          <tbody>
            {actors.map((actor) => (
              <tr key={actor.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={actor.id}>
                  {actor.id.substring(0, 8)}...
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <strong>Actor ID:</strong>{' '}
                      {actor.actorId ? (
                        <a href={actor.actorId} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                          {actor.actorId}
                        </a>
                      ) : '-'}
                    </div>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <strong>IRI:</strong> {actor.iri || '-'}
                    </div>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <strong>URL:</strong>{' '}
                      {actor.url ? (
                        <a href={actor.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                          {actor.url}
                        </a>
                      ) : '-'}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{actor.acct || '-'}</td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontWeight: '600' }}>{actor.preferredUsername}</td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{actor.name || '-'}</td>
                <td style={{ padding: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={actor.summary}>
                  {actor.summary || '-'}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{actor.domain}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: actor.isLocal ? '#d4edda' : '#f8d7da',
                    color: actor.isLocal ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}>
                    {actor.isLocal ? 'Local' : 'Remote'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{actor.type}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.icon?.url ? (
                    <a href={actor.icon.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      🖼️
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.image?.url ? (
                    <a href={actor.image.url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      🖼️
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {actor.manuallyApprovesFollowers ? '🔒' : '🔓'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.inboxUrl ? (
                    <a href={actor.inboxUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      📥
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.outboxUrl ? (
                    <a href={actor.outboxUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      📤
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.sharedInboxUrl ? (
                    <a href={actor.sharedInboxUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      📬
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.followersUrl ? (
                    <a href={actor.followersUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      👥
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                  {actor.followingUrl ? (
                    <a href={actor.followingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                      👤
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>{actor.followersCount.toLocaleString()}</td>
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>{actor.followingCount.toLocaleString()}</td>
                <td style={{ padding: '0.75rem' }}>
                  {actor.user ? (
                    <span style={{ color: '#667eea', fontWeight: '500' }}>
                      {actor.user.username}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {new Date(actor.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {new Date(actor.updatedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  {actor.lastFetchedAt ? new Date(actor.lastFetchedAt).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
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
          onClick={() => setPage(p => p + 1)}
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
