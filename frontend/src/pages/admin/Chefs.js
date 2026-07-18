import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, TextField,
  IconButton, Chip, CircularProgress, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPageHeader from '../../components/AdminPageHeader';
import GroupIcon from '@mui/icons-material/Group';
import { adminService } from '../../services/api';
import api from '../../services/api';

const ChefsManagement = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [gmail, setGmail] = useState('');
  const [displayName, setDisplayName] = useState('');
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
    if (!gmail.includes('@')) {
      setSnackbar({ open: true, message: 'Enter a valid Gmail address', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/chefs', { gmail: gmail.trim(), display_name: displayName.trim() || null });
      setSnackbar({ open: true, message: 'Chef added successfully', severity: 'success' });
      setAddOpen(false);
      setGmail(''); setDisplayName('');
      fetchChefs();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to add chef', severity: 'error' });
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

  return (
    <Container>
      <AdminPageHeader
        title="Chef Accounts"
        subtitle="Manage which Google accounts can access the chef portal"
        icon={<GroupIcon />}
        actions={[{
          label: 'Add Chef',
          icon: <AddIcon />,
          onClick: () => setAddOpen(true),
          variant: 'contained',
        }]}
      />

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#121212' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Add a chef's Gmail address. They can then sign in at <strong>/chef/login</strong> using Google.
          Each Gmail is scoped to this hotel only.
        </Alert>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: '#FFA500' }} />
          </Box>
        ) : chefs.length === 0 ? (
          <Typography sx={{ color: '#666', textAlign: 'center', py: 4 }}>
            No chef accounts yet. Add a Gmail to get started.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Gmail</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Display Name</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFA500', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chefs.map(chef => (
                  <TableRow key={chef.id}>
                    <TableCell sx={{ color: '#fff' }}>{chef.gmail}</TableCell>
                    <TableCell sx={{ color: '#ccc' }}>{chef.display_name || '—'}</TableCell>
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
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1a1a1a' } }}>
        <DialogTitle sx={{ color: '#FFA500' }}>Add Chef</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Gmail Address" value={gmail}
            onChange={e => setGmail(e.target.value)}
            sx={{ mb: 2, mt: 1 }} placeholder="chef@gmail.com"
            inputProps={{ style: { color: '#fff' } }}
            InputLabelProps={{ style: { color: '#888' } }}
          />
          <TextField
            fullWidth label="Display Name (optional)" value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            inputProps={{ style: { color: '#fff' } }}
            InputLabelProps={{ style: { color: '#888' } }}
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

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1a1a1a' } }}>
        <DialogTitle sx={{ color: '#f44336' }}>Remove Chef</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#ccc' }}>
            Remove <strong style={{ color: '#fff' }}>{deleteTarget?.gmail}</strong> as a chef for this hotel?
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
