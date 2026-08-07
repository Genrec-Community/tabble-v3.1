import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, TextField,
  IconButton, Chip, CircularProgress, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AdminPageHeader from '../../components/AdminPageHeader';
import GroupIcon from '@mui/icons-material/Group';
import { adminService } from '../../services/api';
import api from '../../services/api';

const ChefsManagement = () => {
  const theme = useTheme();
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/chefs');
      setChefs(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load chefs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChefs(); }, []);

  const handleAdd = async () => {
    if (!username.trim()) {
      setSnackbar({ open: true, message: 'Username is required', severity: 'error' });
      return;
    }
    if (!password || password.length < 4) {
      setSnackbar({ open: true, message: 'Password must be at least 4 characters', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/chefs', {
        username: username.trim(),
        password,
        display_name: displayName.trim() || null,
      });
      setSnackbar({ open: true, message: 'Chef added successfully', severity: 'success' });
      setAddOpen(false);
      setUsername(''); setPassword(''); setDisplayName(''); setShowPassword(false);
      fetchChefs();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to add chef', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!newPassword || newPassword.length < 4) {
      setSnackbar({ open: true, message: 'New password must be at least 4 characters', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/chefs/${editTarget.id}`, {
        password: newPassword,
        display_name: displayName,
        is_active: editTarget.is_active,
      });
      setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
      setEditOpen(false);
      setNewPassword(''); setShowNewPassword(false);
      fetchChefs();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to update password', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/admin/chefs/${id}/toggle`);
      fetchChefs();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update chef', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/chefs/${deleteTarget.id}`);
      setSnackbar({ open: true, message: 'Chef removed', severity: 'success' });
      setDeleteTarget(null);
      fetchChefs();
    } catch {
      setSnackbar({ open: true, message: 'Failed to remove chef', severity: 'error' });
    }
  };

  const fieldInputProps = { style: { color: theme.palette.text.primary } };
  const fieldLabelProps = { style: { color: theme.palette.text.secondary } };

  return (
    <Container>
      <AdminPageHeader
        title="Chef Accounts"
        subtitle="Manage chef login access with username and password"
        icon={<GroupIcon />}
        actions={[{
          label: 'Add Chef',
          icon: <AddIcon />,
          onClick: () => setAddOpen(true),
          variant: 'contained',
        }]}
      />

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Create a username and password for each chef. They sign in at <strong>/chef/login</strong>
          with these credentials. Passwords are stored encrypted (SHA-256) and can be reset by you anytime.
        </Alert>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: '#FFA500' }} />
          </Box>
        ) : chefs.length === 0 ? (
          <Typography sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 4 }}>
            No chef accounts yet. Add a username and password to get started.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Display Name</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chefs.map(chef => (
                  <TableRow key={chef.id}>
                    <TableCell sx={{ color: theme.palette.text.primary }}>{chef.username}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>{chef.display_name || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={chef.is_active ? 'Active' : 'Inactive'}
                        color={chef.is_active ? 'success' : 'default'}
                        size="small"
                        onClick={() => handleToggle(chef.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        title="Reset password"
                        onClick={() => {
                          setEditTarget(chef);
                          setDisplayName(chef.display_name || '');
                          setNewPassword('');
                          setShowNewPassword(false);
                          setEditOpen(true);
                        }}
                      >
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(chef)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Chef Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: theme.palette.background.paper } }}>
        <DialogTitle sx={{ color: '#FFA500' }}>Add Chef</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Username" value={username}
            onChange={e => setUsername(e.target.value)}
            sx={{ mb: 2, mt: 1 }} placeholder="chef_kumar"
            inputProps={fieldInputProps}
            InputLabelProps={fieldLabelProps}
          />
          <TextField
            fullWidth label="Password" type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={fieldInputProps}
            InputLabelProps={fieldLabelProps}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                    sx={{ color: theme.palette.text.secondary }}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            fullWidth label="Display Name (optional)" value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            inputProps={fieldInputProps}
            InputLabelProps={fieldLabelProps}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={saving}
            sx={{ bgcolor: '#FFA500', color: '#000', '&:hover': { bgcolor: '#E69500' } }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#000' }} /> : 'Add Chef'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: theme.palette.background.paper } }}>
        <DialogTitle sx={{ color: '#FFA500' }}>
          Reset Password — {editTarget?.username}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Display Name" value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            inputProps={fieldInputProps}
            InputLabelProps={fieldLabelProps}
          />
          <TextField
            fullWidth label="New Password" type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            inputProps={fieldInputProps}
            InputLabelProps={fieldLabelProps}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end"
                    sx={{ color: theme.palette.text.secondary }}>
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            The new password will be encrypted and the chef must use it next time they sign in.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={saving}
            sx={{ bgcolor: '#FFA500', color: '#000', '&:hover': { bgcolor: '#E69500' } }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#000' }} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: theme.palette.background.paper } }}>
        <DialogTitle sx={{ color: '#f44336' }}>Remove Chef</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary }}>
            Remove <strong style={{ color: theme.palette.text.primary }}>{deleteTarget?.username}</strong> as a chef for this hotel?
            They will no longer be able to access the chef portal.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          sx={{ borderRadius: '50px' }}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChefsManagement;