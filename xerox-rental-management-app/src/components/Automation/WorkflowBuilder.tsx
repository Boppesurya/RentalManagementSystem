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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  ListItemButton
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  ExpandMore,
  Settings,
  FlashOn,
  CallSplit,
  Timer} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const WorkflowBuilder: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBuilderDialog, setOpenBuilderDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: '',
    enabled: true,
    priority: 'MEDIUM'
  });

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, [user]);

  const loadWorkflows = async () => {
    try {
      // For now, show empty workflows until automation is implemented
      setWorkflows([]);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setWorkflows([]);
    }
  };

  const loadTemplates = async () => {
    try {
      // For now, show empty templates until automation is implemented
      setTemplates([]);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setFormData({
      name: '',
      description: '',
      trigger: '',
      enabled: true,
      priority: 'MEDIUM'
    });
    setWorkflowSteps([]);
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleEditWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      enabled: workflow.status === 'ACTIVE',
      priority: 'MEDIUM'
    });
    setWorkflowSteps(workflow.steps || []);
    setOpenDialog(true);
  };

  const handleOpenBuilder = () => {
    setOpenDialog(false);
    setOpenBuilderDialog(true);
  };

  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      // Update workflow status
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, status: enabled ? 'ACTIVE' : 'PAUSED' }
          : w
      ));
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const addWorkflowStep = (type: string) => {
    const newStep = {
      id: Date.now().toString(),
      type,
      name: `New ${type}`,
      condition: '',
      action: '',
      parameters: {}
    };
    setWorkflowSteps(prev => [...prev, newStep]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'warning';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <FlashOn sx={{ color: '#ff9800' }} />;
      case 'condition': return <CallSplit sx={{ color: '#2196f3' }} />;
      case 'action': return <PlayArrow sx={{ color: '#4caf50' }} />;
      case 'delay': return <Timer sx={{ color: '#9c27b0' }} />;
      default: return <Settings />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Workflow Automation
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateWorkflow}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Create Workflow
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Active Workflows */}
        <Grid size={{xs:12,lg:8}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Active Workflows
            </Typography>
            <Grid container spacing={3}>
              {workflows.map((workflow) => (
                <Grid size={{xs:12}} key={workflow.id}>
                  <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {workflow.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {workflow.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Chip
                              label={workflow.status}
                              color={getStatusColor(workflow.status)}
                              size="small"
                            />
                            <Typography variant="body2" color="text.secondary">
                              Trigger: {workflow.trigger}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            <Typography variant="body2">
                              Executions: <strong>{workflow.executions}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Success Rate: <strong>{workflow.successRate}%</strong>
                            </Typography>
                            <Typography variant="body2">
                              Last Run: <strong>{workflow.lastRun.toLocaleString()}</strong>
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Switch
                            checked={workflow.status === 'ACTIVE'}
                            onChange={(e) => handleToggleWorkflow(workflow.id, e.target.checked)}
                            color="primary"
                          />
                          <IconButton onClick={() => handleEditWorkflow(workflow)} color="primary">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteWorkflow(workflow.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      {/* Workflow Steps Preview */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {workflow.steps?.map((step: any, index: number) => (
                          <Chip
                            key={index}
                            icon={getStepIcon(step.type)}
                            label={step.name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Workflow Templates */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Workflow Templates
            </Typography>
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid size={{xs:12,md:6}} key={template.id}>
                  <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Chip label={template.category} size="small" color="primary" sx={{ mb: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Triggers: {template.triggers.join(', ')}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Actions: {template.actions.join(', ')}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Add />}
                        sx={{ borderRadius: 2 }}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Workflow Statistics */}
        <Grid size={{xs:12,lg:4}}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Automation Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {workflows.filter(w => w.status === 'ACTIVE').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Workflows
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {workflows.reduce((sum, w) => sum + w.executions, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Executions
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Success Rate
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{xs:6}}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitoring
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Activity */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Recent Activity
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Low Toner Alert executed"
                  secondary="2 minutes ago"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <PlayArrow sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Maintenance Scheduler started"
                  secondary="15 minutes ago"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Warning sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Invoice Auto-Generation paused"
                  secondary="1 hour ago"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Workflow Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12}}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Trigger Type</InputLabel>
                <Select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                >
                  <MenuItem value="schedule">Schedule-based</MenuItem>
                  <MenuItem value="event">Event-based</MenuItem>
                  <MenuItem value="condition">Condition-based</MenuItem>
                  <MenuItem value="manual">Manual Trigger</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12,sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12}}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enable workflow immediately"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleOpenBuilder} variant="outlined">
            Open Builder
          </Button>
          <Button variant="contained">
            {selectedWorkflow ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Builder Dialog */}
      <Dialog open={openBuilderDialog} onClose={() => setOpenBuilderDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Workflow Builder - {formData.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{xs:12,md:8}}>
              <Paper sx={{ p: 3, minHeight: 400 }}>
                <Typography variant="h6" gutterBottom>Workflow Steps</Typography>
                <Stepper orientation="vertical" activeStep={activeStep}>
                  {workflowSteps.map((step, _index) => (
                    <Step key={step.id}>
                      <StepLabel icon={getStepIcon(step.type)}>
                        {step.name}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.type === 'trigger' && `Condition: ${step.condition}`}
                          {step.type === 'action' && `Action: ${step.action}`}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<Edit />}>Edit</Button>
                          <Button size="small" color="error" startIcon={<Delete />}>Delete</Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
                {workflowSteps.length === 0 && (
                  <Alert severity="info">
                    No steps added yet. Use the panel on the right to add workflow steps.
                  </Alert>
                )}
              </Paper>
            </Grid>
            <Grid size={{xs:12,md:4}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Add Steps</Typography>
                <Grid container spacing={2}>
                  <Grid size={{xs:12}}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FlashOn />}
                      onClick={() => addWorkflowStep('trigger')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Trigger
                    </Button>
                  </Grid>
                  <Grid size={{xs:12}}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CallSplit />}
                      onClick={() => addWorkflowStep('condition')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Condition
                    </Button>
                  </Grid>
                  <Grid size={{xs:12}}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => addWorkflowStep('action')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Action
                    </Button>
                  </Grid>
                  <Grid size={{xs:12}}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Timer />}
                      onClick={() => addWorkflowStep('delay')}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Delay
                    </Button>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>Available Actions</Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Notifications</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItemButton>
                        <ListItemText primary="Send Email" />
                      </ListItemButton>
                      <ListItemButton>
                        <ListItemText primary="Send SMS" />
                      </ListItemButton>
                      <ListItemButton>
                        <ListItemText primary="Push Notification" />
                      </ListItemButton>
                    </List>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Maintenance</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItemButton>
                        <ListItemText primary="Schedule Service" />
                      </ListItemButton>
                      <ListItemButton>
                        <ListItemText primary="Create Work Order" />
                      </ListItemButton>
                      <ListItemButton>
                        <ListItemText primary="Update Status" />
                      </ListItemButton>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBuilderDialog(false)}>Cancel</Button>
          <Button variant="outlined">Test Workflow</Button>
          <Button variant="contained">Save Workflow</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowBuilder;