import { useState, useEffect } from "react";
import { adminAPI, Actor } from "../lib/api";
import Layout from "../components/Layout";

export default function Actors() {
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
        case "UNAUTHORIZED":
          // handled by interceptor
          break;
        case "NETWORK":
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
    if (!confirm('이 액터를 동기화하시겠습니까?')) {
      return;
    }

    setSyncingActorId(actorId);
    const result = await adminAPI.syncActor(actorId);
    if (!result.ok) {
      switch (result.error.type) {
        case "NOT_FOUND":
          alert("액터를 찾을 수 없습니다.");
          break;
        case "NETWORK":
          alert(`액터 동기화에 실패했습니다: ${result.error.message}`);
          break;
      }
      setSyncingActorId(null);
      return;
    }
    alert("액터가 성공적으로 동기화되었습니다.");
    await fetchActors();
    setSyncingActorId(null);
  };

  const handleSyncAllLocalActors = async () => {
    if (!confirm('모든 로컬 액터를 동기화하시겠습니까?')) {
      return;
    }

    setSyncingAll(true);
    const result = await adminAPI.syncAllLocalActors();
    if (!result.ok) {
      switch (result.error.type) {
        case "NETWORK":
          alert(`액터 동기화에 실패했습니다: ${result.error.message}`);
          break;
      }
      setSyncingAll(false);
      return;
    }
    let message = `${result.value.synced}개의 액터가 동기화되었습니다.`;
    if (result.value.errors && result.value.errors.length > 0) {
      message += `\n\n오류:\n${result.value.errors.join("\n")}`;
    }
    alert(message);
    await fetchActors();
    setSyncingAll(false);
  };

  const handleFetchActor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actorUrl.trim()) {
      alert('ActivityPub URL을 입력해주세요.');
      return;
    }

    setFetching(true);
    const result = await adminAPI.fetchAndPersistActor(actorUrl);
    if (!result.ok) {
      switch (result.error.type) {
        case "VALIDATION":
          alert(`유효하지 않은 입력: ${result.error.message}`);
          break;
        case "NOT_FOUND":
          alert("액터를 찾을 수 없습니다.");
          break;
        case "NETWORK":
          alert(`액터를 가져오는데 실패했습니다: ${result.error.message}`);
          break;
        case "UNKNOWN":
          alert(`알 수 없는 오류: ${result.error.cause.message}`);
          break;
        default:
          alert("액터를 가져오는데 실패했습니다.");
      }
      setFetching(false);
      return;
    }
    alert(
      `액터를 성공적으로 가져왔습니다: ${result.value.actor.preferredUsername}`
    );
    setActorUrl("");
    await fetchActors();
    setFetching(false);
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>Actors</h1>

        {/* Fetch Actor Form */}
        <form onSubmit={handleFetchActor} style={{ marginBottom: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label htmlFor="actorUrl" style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
              원격 액터 가져오기:
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
              {fetching ? '가져오는 중...' : '가져오기'}
            </button>
          </div>
        </form>

        {/* Actions and Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {syncingAll ? '동기화 중...' : '모든 로컬 액터 동기화'}
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

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '2500px' }}>
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
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Actions</th>
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
                <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                  {actor.isLocal && (
                    <button
                      onClick={() => handleSyncActor(actor.id)}
                      disabled={syncingActorId === actor.id}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: syncingActorId === actor.id ? '#ccc' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: syncingActorId === actor.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      {syncingActorId === actor.id ? '동기화 중...' : '동기화'}
                    </button>
                  )}
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
