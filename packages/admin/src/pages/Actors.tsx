import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import Layout from '../components/Layout';

interface Actor {
  id: string;
  preferredUsername: string;
  name: string;
  domain: string;
  isLocal: boolean;
  userId: string | null;
  createdAt: string;
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

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Display Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Domain</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Local User</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {actors.map((actor) => (
              <tr key={actor.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{actor.preferredUsername}</td>
                <td style={{ padding: '0.75rem' }}>{actor.name || '-'}</td>
                <td style={{ padding: '0.75rem' }}>{actor.domain}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: actor.isLocal ? '#d4edda' : '#f8d7da',
                    color: actor.isLocal ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}>
                    {actor.isLocal ? 'Local' : 'Remote'}
                  </span>
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
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {new Date(actor.createdAt).toLocaleDateString()}
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
