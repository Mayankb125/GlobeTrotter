import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/users';
import { useToast } from '../components/Toast';

export const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setAuth, logout } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.avatar_url || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Deletion double-confirmation flow states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Name and email are required fields.', '⚠️');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = { name, email, profile_photo_url: profilePhotoUrl };
      if (password) {
        updateData.password = password;
      }

      const updatedUser = await usersApi.updateProfile(updateData);
      
      // Update store
      const token = localStorage.getItem('globetrotter_jwt_token') || '';
      setAuth(updatedUser, token);

      setPassword('');
      showToast('Profile updated successfully!', '✅');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to update profile settings';
      showToast(msg, '⚠️');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      showToast("Please type 'delete my account' exactly to confirm.", '⚠️');
      return;
    }

    try {
      setLoading(true);
      await usersApi.deleteAccount();
      logout();
      showToast('Your account was permanently deleted.', '🔒');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete account', '⚠️');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Profile Settings
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Manage your personal details, profile picture, and account settings.
        </p>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--gt-primary-tint, #eef7f6)',
                color: 'var(--gt-primary, #144a47)',
                fontSize: '22px',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                border: '2px stroke var(--gt-border)',
              }}
            >
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                  }}
                />
              ) : (
                name.substring(0, 2).toUpperCase() || 'GT'
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>Profile Photo</h3>
              <p className="small muted" style={{ margin: 0 }}>
                Provide an image URL below to set your profile picture.
              </p>
            </div>
          </div>

          <div className="field">
            <label>Name</label>
            <div className="input-icon-wrap">
              <span className="ico">👤</span>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Email Address</label>
            <div className="input-icon-wrap">
              <span className="ico">✉</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Profile Image URL</label>
            <div className="input-icon-wrap">
              <span className="ico">🖼</span>
              <input
                className="input"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Change Password (optional)</label>
            <div className="input-icon-wrap">
              <span className="ico">🔑</span>
              <input
                className="input"
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings →'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div
        className="card card-pad"
        style={{
          borderColor: '#fca5a5',
          background: 'var(--gt-light-red, #fef2f2)',
          color: '#991b1b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: '#991b1b' }}>
            Danger Zone
          </h3>
          <p className="small" style={{ margin: 0, opacity: 0.85 }}>
            Deleting your account is permanent. All your itineraries, customized stop activities, and budget plans will be deleted instantly.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn"
            style={{ background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div className="card card-pad" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#991b1b' }}>
              Are you absolutely sure?
            </h3>
            <p className="small muted" style={{ marginBottom: '16px' }}>
              This action cannot be undone. All your saved travel data will be deleted.
            </p>
            <p className="small" style={{ marginBottom: '12px' }}>
              Please type <b>delete my account</b> below to confirm:
            </p>
            <input
              className="input"
              type="text"
              placeholder="delete my account"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'delete my account'}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
