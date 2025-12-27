import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Settings, Save, RotateCcw, Shield, Users, Zap } from 'lucide-react';

const RateLimitConfig: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const defaultConfig = {
    authentication: 5,
    generalApi: 100,
    subscription: 20,
    payment: 10,
    reportGeneration: 5,
    fileUpload: 10,
    email: 20,
    publicApi: 50,
    premiumMultiplier: 2.0,
    enterpriseMultiplier: 5.0,
    persistEvents: true,
    whitelistedIps: '192.168.1.100, 10.0.0.50',
    whitelistedUserIds: '1, 2'
  };

  const [config, setConfig] = useState(defaultConfig);

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  const calculatePremiumLimit = (base: number) => Math.round(base * config.premiumMultiplier);
  const calculateEnterpriseLimit = (base: number) => Math.round(base * config.enterpriseMultiplier);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Rate Limit Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure rate limits for different endpoint types and user tiers
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuration saved successfully! Changes will take effect on the next server restart.
        </Alert>
      )}

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Note: Configuration is Read-Only in UI
        </Typography>
        <Typography variant="body2">
          To modify rate limits, edit <code>application.properties</code> on the backend server and restart the
          application. This interface shows current configuration for reference.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:6}}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Settings size={24} color="#1976d2" />
                <Typography variant="h6" fontWeight="bold">
                  Base Rate Limits
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Requests per minute (except Email: per hour)
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Authentication"
                    type="number"
                    value={config.authentication}
                    onChange={(e) => setConfig({ ...config, authentication: Number(e.target.value) })}
                    helperText="Login and registration endpoints"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Payment Operations"
                    type="number"
                    value={config.payment}
                    onChange={(e) => setConfig({ ...config, payment: Number(e.target.value) })}
                    helperText="Payment processing endpoints"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Report Generation"
                    type="number"
                    value={config.reportGeneration}
                    onChange={(e) => setConfig({ ...config, reportGeneration: Number(e.target.value) })}
                    helperText="PDF and export operations"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="File Upload"
                    type="number"
                    value={config.fileUpload}
                    onChange={(e) => setConfig({ ...config, fileUpload: Number(e.target.value) })}
                    helperText="Document upload endpoints"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Subscription"
                    type="number"
                    value={config.subscription}
                    onChange={(e) => setConfig({ ...config, subscription: Number(e.target.value) })}
                    helperText="Subscription management"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="number"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: Number(e.target.value) })}
                    helperText="Email sending (per hour)"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="Public API"
                    type="number"
                    value={config.publicApi}
                    onChange={(e) => setConfig({ ...config, publicApi: Number(e.target.value) })}
                    helperText="Public endpoints"
                    disabled
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    fullWidth
                    label="General API"
                    type="number"
                    value={config.generalApi}
                    onChange={(e) => setConfig({ ...config, generalApi: Number(e.target.value) })}
                    helperText="All other endpoints"
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:6}}>
          <Grid container spacing={3}>
            <Grid size={{xs:12}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Users size={24} color="#9c27b0" />
                    <Typography variant="h6" fontWeight="bold">
                      User Tier Multipliers
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Premium Multiplier"
                        type="number"
                        value={config.premiumMultiplier}
                        onChange={(e) => setConfig({ ...config, premiumMultiplier: Number(e.target.value) })}
                        helperText="Premium/Professional plans"
                        inputProps={{ step: 0.1 }}
                        disabled
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Enterprise Multiplier"
                        type="number"
                        value={config.enterpriseMultiplier}
                        onChange={(e) => setConfig({ ...config, enterpriseMultiplier: Number(e.target.value) })}
                        helperText="Enterprise/Unlimited plans"
                        inputProps={{ step: 0.1 }}
                        disabled
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Calculated Limits Preview
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Standard</TableCell>
                          <TableCell align="right">Premium</TableCell>
                          <TableCell align="right">Enterprise</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Auth</TableCell>
                          <TableCell align="right">{config.authentication}</TableCell>
                          <TableCell align="right">{calculatePremiumLimit(config.authentication)}</TableCell>
                          <TableCell align="right">{calculateEnterpriseLimit(config.authentication)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Payment</TableCell>
                          <TableCell align="right">{config.payment}</TableCell>
                          <TableCell align="right">{calculatePremiumLimit(config.payment)}</TableCell>
                          <TableCell align="right">{calculateEnterpriseLimit(config.payment)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>General</TableCell>
                          <TableCell align="right">{config.generalApi}</TableCell>
                          <TableCell align="right">{calculatePremiumLimit(config.generalApi)}</TableCell>
                          <TableCell align="right">{calculateEnterpriseLimit(config.generalApi)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs:12}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Shield size={24} color="#4caf50" />
                    <Typography variant="h6" fontWeight="bold">
                      Whitelisting
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Whitelisted IPs"
                        value={config.whitelistedIps}
                        onChange={(e) => setConfig({ ...config, whitelistedIps: e.target.value })}
                        helperText="Comma-separated IP addresses"
                        multiline
                        rows={2}
                        disabled
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <TextField
                        fullWidth
                        label="Whitelisted User IDs"
                        value={config.whitelistedUserIds}
                        onChange={(e) => setConfig({ ...config, whitelistedUserIds: e.target.value })}
                        helperText="Comma-separated user IDs"
                        disabled
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs:12}}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Zap size={24} color="#ff9800" />
                    <Typography variant="h6" fontWeight="bold">
                      Advanced Options
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.persistEvents}
                        onChange={(e) => setConfig({ ...config, persistEvents: e.target.checked })}
                        disabled
                      />
                    }
                    label="Persist Events to Database"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Store all rate limit events for analytics and monitoring
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{xs:12}}>
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              How to Update Configuration
            </Typography>
            <Typography variant="body2" paragraph>
              1. Open <code>backend/src/main/resources/application.properties</code>
            </Typography>
            <Typography variant="body2" paragraph>
              2. Modify the rate limit properties:
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem'
              }}
            >
              {`rate.limit.authentication=5
rate.limit.general-api=100
rate.limit.premium-multiplier=2.0
rate.limit.enterprise-multiplier=5.0
rate.limit.whitelisted-ips=192.168.1.100,10.0.0.50
rate.limit.persist.events=true`}
            </Box>
            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              3. Restart the application for changes to take effect
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{xs:12}}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<RotateCcw size={18} />} onClick={handleReset} disabled>
              Reset to Defaults
            </Button>
            <Button variant="contained" startIcon={<Save size={18} />} onClick={handleSave} disabled>
              Save Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RateLimitConfig;
