import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Alert
} from '@mui/material';
import {
  Assessment,
  GetApp,
  Schedule,
  Edit,
  Add,
  Refresh,
  CloudUpload
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

const AdvancedReporting: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [reportData, setReportData] = useState<any>({
    revenue_trend: [],
    machine_utilization: [],
    customer_satisfaction: [],
    financial_breakdown: [],
    kpi_metrics: {
      total_revenue: 450000,
      profit_margin: 34.8,
      customer_satisfaction: 94.2,
      machine_uptime: 99.1,
      cost_efficiency: 87.5,
      growth_rate: 12.3
    }
  });
  const [loading, setLoading] = useState(false);

  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    type: 'dashboard',
    frequency: 'monthly',
    format: 'pdf',
    recipients: '',
    includeCharts: true,
    includeTables: true,
    includeInsights: true
  });

  useEffect(() => {
    loadReports();
    loadTemplates();
    loadReportData();
  }, []);

  const loadReports = async () => {
    try {
      // Mock reports data
      const mockReports = [
        {
          id: '1',
          name: 'Monthly Revenue Report',
          description: 'Comprehensive monthly revenue analysis',
          type: 'financial',
          frequency: 'monthly',
          status: 'ACTIVE',
          lastGenerated: new Date(),
          recipients: ['admin@xerox.com', 'finance@xerox.com']
        },
        {
          id: '2',
          name: 'Machine Utilization Report',
          description: 'Machine performance and utilization metrics',
          type: 'operational',
          frequency: 'weekly',
          status: 'ACTIVE',
          lastGenerated: new Date(Date.now() - 86400000),
          recipients: ['operations@xerox.com']
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const mockTemplates = [
        {
          id: '1',
          name: 'Executive Summary',
          description: 'High-level business metrics and KPIs',
          category: 'Executive',
          frequency: 'monthly'
        },
        {
          id: '2',
          name: 'Operational Dashboard',
          description: 'Detailed operational metrics and performance',
          category: 'Operations',
          frequency: 'weekly'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const mockData = {
        revenue_trend: [
          { month: 'Jan', revenue: 65000, profit: 22100 },
          { month: 'Feb', revenue: 72000, profit: 25200 },
          { month: 'Mar', revenue: 78000, profit: 27300 },
          { month: 'Apr', revenue: 85000, profit: 29750 },
          { month: 'May', revenue: 92000, profit: 32200 },
          { month: 'Jun', revenue: 98000, profit: 34300 }
        ],
        machine_utilization: [
          { name: 'WorkCentre', utilization: 89 },
          { name: 'VersaLink', utilization: 85 },
          { name: 'AltaLink', utilization: 92 },
          { name: 'PrimeLink', utilization: 78 }
        ],
        customer_satisfaction: [
          { month: 'Jan', satisfaction: 92, nps: 78 },
          { month: 'Feb', satisfaction: 94, nps: 82 },
          { month: 'Mar', satisfaction: 93, nps: 80 },
          { month: 'Apr', satisfaction: 95, nps: 85 },
          { month: 'May', satisfaction: 94, nps: 83 },
          { month: 'Jun', satisfaction: 96, nps: 87 }
        ],
        financial_breakdown: [
          { name: 'Rental Revenue', amount: 320000 },
          { name: 'Maintenance', amount: 45000 },
          { name: 'Support', amount: 25000 },
          { name: 'Other', amount: 15000 }
        ],
        kpi_metrics: {
          total_revenue: 450000,
          profit_margin: 34.8,
          customer_satisfaction: 94.2,
          machine_uptime: 99.1,
          cost_efficiency: 87.5,
          growth_rate: 12.3
        }
      };
      setReportData(mockData);
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportData({
        revenue_trend: [],
        machine_utilization: [],
        customer_satisfaction: [],
        financial_breakdown: [],
        kpi_metrics: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = () => {
    setSelectedReport(null);
    setReportConfig({
      name: '',
      description: '',
      type: 'dashboard',
      frequency: 'monthly',
      format: 'pdf',
      recipients: '',
      includeCharts: true,
      includeTables: true,
      includeInsights: true
    });
    setOpenDialog(true);
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setReportConfig({
      name: report.name,
      description: report.description,
      type: report.type,
      frequency: report.frequency,
      format: 'pdf',
      recipients: report.recipients.join(', '),
      includeCharts: true,
      includeTables: true,
      includeInsights: true
    });
    setOpenDialog(true);
  };

  const handleScheduleReport = (report: any) => {
    setSelectedReport(report);
    setOpenScheduleDialog(true);
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, lastGenerated: new Date() }
          : r
      ));
      
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'warning';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Advanced Reporting
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadReportData}
            disabled={loading}
          >
            Refresh Data
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateReport}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs:12, lg:8}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Active Reports
            </Typography>
            {reports.length === 0 ? (
              <Alert severity="info">
                No reports created yet. Create your first report to start generating insights.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {reports.map((report) => (
                  <Grid size={{xs:12}} key={report.id}>
                    <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {report.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {report.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Chip
                                label={report.status}
                                color={getStatusColor(report.status)}
                                size="small"
                              />
                              <Chip
                                label={report.frequency}
                                variant="outlined"
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                Last generated: {report.lastGenerated.toLocaleString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Recipients: {report.recipients.join(', ')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Generate Now">
                              <IconButton 
                                onClick={() => handleGenerateReport(report.id)}
                                color="primary"
                                disabled={loading}
                              >
                                <Assessment />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Schedule">
                              <IconButton onClick={() => handleScheduleReport(report)} color="info">
                                <Schedule />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditReport(report)} color="primary">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Export">
                              <IconButton onClick={() => handleExportReport('pdf')} color="success">
                                <GetApp />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Report Preview
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{xs:12, md:6}}>
                <Typography variant="subtitle2" gutterBottom>Revenue Trend</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={reportData.revenue_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} />
                    <Line type="monotone" dataKey="profit" stroke="#4caf50" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{xs:12, md:6}}>
                <Typography variant="subtitle2" gutterBottom>Machine Utilization</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.machine_utilization}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Bar dataKey="utilization" fill="#667eea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{xs:12, md:6}}>
                <Typography variant="subtitle2" gutterBottom>Customer Satisfaction</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={reportData.customer_satisfaction}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="satisfaction" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="nps" stroke="#ff9800" fill="#ff9800" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{xs:12, md:6}}>
                <Typography variant="subtitle2" gutterBottom>Revenue Breakdown</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.financial_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }: any) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.financial_breakdown?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{xs:12, lg:4}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(reportData.kpi_metrics || {}).map(([key, value]) => (
                <Grid size={{xs:6}} key={key}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: COLORS[Object.keys(reportData.kpi_metrics).indexOf(key) % COLORS.length] }}>
                      {typeof value === 'number' ? 
                        (key.includes('revenue') || key.includes('cost') ? 
                          `₹${(value / 1000).toFixed(0)}K` : 
                          key.includes('rate') || key.includes('satisfaction') || key.includes('margin') || key.includes('uptime') ? 
                          `${value}%` : 
                          value.toLocaleString()
                        ) : String(value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Report Templates
            </Typography>
            {templates.map((template) => (
              <Card key={template.id} sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.description}
                  </Typography>
                  <Chip label={template.category} size="small" color="primary" sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Frequency: {template.frequency}
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    sx={{ mt: 1, borderRadius: 2 }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Export Options
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={() => handleExportReport('pdf')}
                  sx={{ borderRadius: 2 }}
                >
                  PDF
                </Button>
              </Grid>
              <Grid size={{xs:6}}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => handleExportReport('excel')}
                  sx={{ borderRadius: 2 }}
                >
                  Excel
                </Button>
              </Grid>
              <Grid size={{xs:6}}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Schedule />}
                  onClick={() => handleExportReport('email')}
                  sx={{ borderRadius: 2 }}
                >
                  Email
                </Button>
              </Grid>
              <Grid size={{xs:6}}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => handleExportReport('cloud')}
                  sx={{ borderRadius: 2 }}
                >
                  Cloud
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedReport ? 'Edit Report' : 'Create New Report'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Report Name"
                value={reportConfig.name}
                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={reportConfig.description}
                onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}} >
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportConfig.type}
                  onChange={(e) => setReportConfig({ ...reportConfig, type: e.target.value })}
                >
                  <MenuItem value="dashboard">Dashboard</MenuItem>
                  <MenuItem value="operational">Operational</MenuItem>
                  <MenuItem value="financial">Financial</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={reportConfig.frequency}
                  onChange={(e) => setReportConfig({ ...reportConfig, frequency: e.target.value })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Recipients (comma-separated emails)"
                value={reportConfig.recipients}
                onChange={(e) => setReportConfig({ ...reportConfig, recipients: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <Typography variant="subtitle2" gutterBottom>Include in Report:</Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeCharts}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeCharts: e.target.checked })}
                    />
                  }
                  label="Charts & Visualizations"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeTables}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeTables: e.target.checked })}
                    />
                  }
                  label="Data Tables"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeInsights}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeInsights: e.target.checked })}
                    />
                  }
                  label="AI Insights"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {selectedReport ? 'Update' : 'Create'} Report
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Schedule Report - {selectedReport?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select defaultValue="weekly">
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                defaultValue="09:00"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Send email notifications"
              />
            </Grid>
            <Grid size={{xs:12}}>
              <FormControlLabel
                control={<Switch />}
                label="Include data attachments"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleDialog(false)}>Cancel</Button>
          <Button variant="contained">Schedule Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedReporting;