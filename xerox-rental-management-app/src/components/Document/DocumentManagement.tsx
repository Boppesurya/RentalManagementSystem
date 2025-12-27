import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  CloudUpload,
  Download,
  Edit,
  Delete,
  Search,
  Description,
  InsertDriveFile,
  AttachFile,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { type Machine, type Contract } from '../../types';

interface DocumentData {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  machine?: { id: string; name: string; serialNumber: string };
  user?: { id: string; name: string; email: string };
  contract?: { id: string; contractNumber: string };
  uploadedBy: { id: string; name: string; email: string };
  version: number;
  status: string;
  expiryDate?: string;
  tags?: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: 'CONTRACT',
    machineId: '',
    contractId: '',
    expiryDate: '',
    tags: '',
    isPublic: false
  });

  useEffect(() => {
    loadDocuments();
    loadMachines();
    loadContracts();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const data = await apiService.getMachines();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const data = await apiService.getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      title: '',
      description: '',
      documentType: 'CONTRACT',
      machineId: '',
      contractId: '',
      expiryDate: '',
      tags: '',
      isPublic: false
    });
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFile(null);
    setError('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title) {
      setError('Please enter a document title');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiService.uploadDocument(selectedFile, {
        title: formData.title,
        documentType: formData.documentType,
        uploadedBy: user?.id || '',
        description: formData.description,
        machineId: formData.machineId || undefined,
        contractId: formData.contractId || undefined,
        expiryDate: formData.expiryDate || undefined,
        tags: formData.tags || undefined,
        isPublic: formData.isPublic
      });

      await loadDocuments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentData) => {
    try {
      const blob = await apiService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loadDocuments();
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await apiService.deleteDocument(documentId);
        await loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        setError('Failed to delete document');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    const typeMap: { [key: string]: any } = {
      'CONTRACT': 'primary',
      'WARRANTY': 'success',
      'INVOICE': 'warning',
      'CERTIFICATE': 'info',
      'MANUAL': 'secondary',
      'MAINTENANCE_REPORT': 'error',
      'INSURANCE': 'default',
      'OTHER': 'default'
    };
    return typeMap[type] || 'default';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <Description color="error" />;
    if (fileType.includes('word') || fileType.includes('document')) return <Description color="primary" />;
    if (fileType.includes('image')) return <InsertDriveFile color="success" />;
    return <AttachFile />;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterType === 'ALL' || doc.documentType === filterType;

    return matchesSearch && matchesFilter;
  });

  const documentTypes = [
    'ALL',
    'CONTRACT',
    'WARRANTY',
    'INVOICE',
    'RECEIPT',
    'CERTIFICATE',
    'MANUAL',
    'SPECIFICATION',
    'MAINTENANCE_REPORT',
    'INSPECTION_REPORT',
    'INSURANCE',
    'LICENSE',
    'AGREEMENT',
    'OTHER'
  ];

  const stats = {
    total: documents.length,
    contracts: documents.filter(d => d.documentType === 'CONTRACT').length,
    warranties: documents.filter(d => d.documentType === 'WARRANTY').length,
    totalSize: documents.reduce((acc, d) => acc + d.fileSize, 0)
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Document Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={handleOpenDialog}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Upload Document
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Documents
                  </Typography>
                </Box>
                <Description sx={{ fontSize: 40, color: '#667eea', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {stats.contracts}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Contracts
                  </Typography>
                </Box>
                <Description sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {stats.warranties}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Warranties
                  </Typography>
                </Box>
                <Description sx={{ fontSize: 40, color: '#ff9800', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:3}}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                    {formatFileSize(stats.totalSize)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Storage Used
                  </Typography>
                </Box>
                <CloudUpload sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12,md:6}}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{xs:12,md:6}}>
            <FormControl fullWidth>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter by Type"
              >
                {documentTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Document</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Related To</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Uploaded By</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Uploaded Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Downloads</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm || filterType !== 'ALL'
                      ? 'No documents found matching your criteria.'
                      : 'No documents uploaded yet. Start by uploading your first document!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(doc.fileType)}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {doc.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.fileName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.documentType.replace(/_/g, ' ')}
                      color={getDocumentTypeColor(doc.documentType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {doc.machine && (
                      <Typography variant="caption">
                        Machine: {doc.machine.name}
                      </Typography>
                    )}
                    {doc.contract && (
                      <Typography variant="caption">
                        Contract: {doc.contract.contractNumber}
                      </Typography>
                    )}
                    {!doc.machine && !doc.contract && (
                      <Typography variant="caption" color="text.secondary">
                        General
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatFileSize(doc.fileSize)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {doc.uploadedBy.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip label={doc.downloadCount} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleDownload(doc)} color="primary">
                      <Download />
                    </IconButton>
                    {user?.role === 'ADMIN' && (
                      <IconButton size="small" onClick={() => handleDelete(doc.id)} color="error">
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Document</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{ py: 2 }}
              >
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                />
              </Button>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Size: {formatFileSize(selectedFile.size)}
                </Typography>
              )}
            </Grid>

            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Document Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>

            <Grid size={{xs:12}}>
              <FormControl fullWidth required>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  label="Document Type"
                >
                  {documentTypes.filter(t => t !== 'ALL').map(type => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Related Machine (Optional)</InputLabel>
                <Select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  label="Related Machine (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {machines.map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} - {machine.serialNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Related Contract (Optional)</InputLabel>
                <Select
                  value={formData.contractId}
                  onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                  label="Related Contract (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {contracts.map(contract => (
                    <MenuItem key={contract.id} value={contract.id}>
                      {contract.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Expiry Date (Optional)"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="contract, warranty, 2024"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;
