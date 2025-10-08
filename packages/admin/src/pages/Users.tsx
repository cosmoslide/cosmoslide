import { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api';
import Layout from '../components/Layout';
import CreateUserModal from '../components/CreateUserModal';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  actor?: {
    id: string;
    actorId: string;
    isLocal: boolean;
  };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers(page, 20);
      setUsers(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Revoke' : 'Grant'} admin access?`)) return;

    try {
      await adminAPI.toggleAdminStatus(userId, !currentStatus);
      fetchUsers();
    } catch (error) {
      alert('Failed to update admin status');
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Users</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Create User
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Display Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Actor</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Admin</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Created</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{user.username}</td>
                <td style={{ padding: '0.75rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem' }}>{user.displayName}</td>
                <td style={{ padding: '0.75rem' }}>
                  {user.actor && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: user.actor.isLocal ? '#d4edda' : '#f8d7da',
                      color: user.actor.isLocal ? '#155724' : '#721c24',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}>
                      {user.actor.isLocal ? 'Local' : 'Remote'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {user.isAdmin ? '✅' : '❌'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: user.isAdmin ? '#f44336' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    {user.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                  </button>
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
          Page {page} ({total} total users)
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={users.length < 20}
          style={{
            padding: '0.5rem 1rem',
            background: users.length < 20 ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: users.length < 20 ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchUsers();
          }}
        />
      )}
    </Layout>
  );
}
