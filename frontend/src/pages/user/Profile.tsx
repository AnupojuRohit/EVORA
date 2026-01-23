import { useState } from 'react';
import { authAPI } from '../../lib/api';

const ProfilePage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await authAPI.changePassword({ old_password: currentPassword, new_password: newPassword });
      setStatus('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setStatus(err?.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg">
      <h1 className="text-xl font-semibold mb-4">Change Password</h1>
      <p className="text-sm text-muted-foreground mb-6">This page is deprecated and will be removed. Use it only to change your password.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">Update Password</button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
};

export default ProfilePage;
