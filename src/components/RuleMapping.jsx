import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Button,
  Checkbox,
  TextField,
  Tooltip,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import './RuleMapping.css';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAppContext } from '../context/AppContext';

const Dashboard = ({ data, showCustomerCommunications }) => {
  // Static data based on provided values
  const COLORS = ['#FF8B8B', '#87CEEB', '#DDA0DD', '#FFA07A', '#90EE90', '#F0E68C'];
  
  // Use useEffect to log when the component re-renders
  useEffect(() => {
    console.log('Dashboard re-rendered with data:', data);
  }, [data, showCustomerCommunications]);
  
  // Calculate total unique policy codes from the data
  const calculateUniquePolicies = () => {
    if (!data || !data.policies) return 0;
    
    const uniquePolicyCodes = new Set();
    const policyDetails = []; // For debugging
    let totalPolicies = 0; // For debugging
    
    // Process only the domains that should be shown based on showCustomerCommunications
    Object.entries(data.policies).forEach(([domain, regulators]) => {
      // Skip Customer Communications if not showing it
      if (!showCustomerCommunications && domain === 'customer_communications') {
        return;
      }
      
      let domainPolicies = 0; // For debugging
      
      regulators.forEach(regulatorObj => {
        Object.entries(regulatorObj).forEach(([regulator, policies]) => {
          policies.forEach(policy => {
            // Only count policies that are included
            if (policy.included !== false) {
              // For Customer Communications, we want to count them separately
              // since they represent different documents even with similar codes
              const policyIdentifier = `${domain}-${policy.policy_code}`;
              uniquePolicyCodes.add(policyIdentifier);
              
              domainPolicies++; // For debugging
              totalPolicies++; // For debugging
              
              // Add to debug list
              policyDetails.push({
                domain,
                regulator,
                policy_code: policy.policy_code,
                policy_identifier: policyIdentifier,
                included: policy.included
              });
            }
          });
        });
      });
      
      console.log(`Domain ${domain} has ${domainPolicies} policies`); // For debugging
    });
    
    // Debug log
    console.log('Unique Policy Identifiers:', Array.from(uniquePolicyCodes));
    console.log('Policy Details:', policyDetails);
    console.log('Total Policies (raw count):', totalPolicies);
    console.log('Total Unique Policies (Set size):', uniquePolicyCodes.size);
    
    return uniquePolicyCodes.size;
  };
  
  // Calculate total unique regulators from the data
  const calculateUniqueRegulators = () => {
    if (!data || !data.policies) return 0;
    
    const uniqueRegulators = new Set();
    
    // Process only the domains that should be shown based on showCustomerCommunications
    Object.entries(data.policies).forEach(([domain, regulators]) => {
      // Skip Customer Communications if not showing it
      if (!showCustomerCommunications && domain === 'customer_communications') {
        return;
      }
      
      regulators.forEach(regulatorObj => {
        // Add each regulator to the set
        Object.keys(regulatorObj).forEach(regulator => {
          // Check if this regulator has any included policies
          const hasIncludedPolicies = regulatorObj[regulator].some(policy => policy.included !== false);
          if (hasIncludedPolicies) {
            uniqueRegulators.add(regulator);
          }
        });
      });
    });
    
    return uniqueRegulators.size;
  };
  
  // Calculate regulator data dynamically
  const calculateRegulatorData = () => {
    if (!data || !data.policies) return [];
    
    const regulatorCounts = {};
    
    // Process only the domains that should be shown based on showCustomerCommunications
    Object.entries(data.policies).forEach(([domain, regulators]) => {
      // Skip Customer Communications if not showing it
      if (!showCustomerCommunications && domain === 'customer_communications') {
        return;
      }
      
      regulators.forEach(regulatorObj => {
        Object.entries(regulatorObj).forEach(([regulator, policies]) => {
          // Count included policies for this regulator
          const includedPoliciesCount = policies.filter(policy => policy.included !== false).length;
          
          if (includedPoliciesCount > 0) {
            if (!regulatorCounts[regulator]) {
              regulatorCounts[regulator] = 0;
            }
            regulatorCounts[regulator] += includedPoliciesCount;
          }
        });
      });
    });
    
    // Convert to array format for the pie chart
    return Object.entries(regulatorCounts).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Calculate domain data dynamically
  const calculateDomainData = () => {
    if (!data || !data.policies) return [];
    
    const domainCounts = {};
    const domainPolicyDetails = {}; // For debugging
    
    // Process only the domains that should be shown based on showCustomerCommunications
    Object.entries(data.policies).forEach(([domain, regulators]) => {
      // Skip Customer Communications if not showing it
      if (!showCustomerCommunications && domain === 'customer_communications') {
        return;
      }
      
      domainCounts[domain] = 0;
      domainPolicyDetails[domain] = []; // Initialize array for this domain
      
      regulators.forEach(regulatorObj => {
        Object.entries(regulatorObj).forEach(([regulator, policies]) => {
          // Count included policies for this domain
          const includedPolicies = policies.filter(policy => policy.included !== false);
          domainCounts[domain] += includedPolicies.length;
          
          // Add to debug list
          includedPolicies.forEach(policy => {
            domainPolicyDetails[domain].push({
              regulator,
              policy_code: policy.policy_code
            });
          });
        });
      });
    });
    
    // Debug log
    console.log('Domain Counts:', domainCounts);
    console.log('Domain Policy Details:', domainPolicyDetails);
    console.log('Total Policies by Domain:', Object.values(domainCounts).reduce((a, b) => a + b, 0));
    
    // Convert to array format for the bar chart
    return Object.entries(domainCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').toUpperCase(),
      value
    }));
  };
  
  // Get dynamic data
  const totalPolicies = calculateUniquePolicies();
  const totalRegulators = calculateUniqueRegulators();
  const regulatorData = calculateRegulatorData();
  const domainData = calculateDomainData();
  
  // Get regulator labels dynamically
  const REGULATOR_LABELS = regulatorData.map(item => item.name);
  
  return (
    <Box className="dashboard-container">
      <Grid container spacing={2}>
        {/* Stats Column */}
        <Grid item xs={12} md={3}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Total Policies Card */}
            <Card className="stat-card">
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Total Policies</Typography>
                <Typography variant="h4" style={{ color: '#673ab7', marginTop: '4px' }}>{totalPolicies}</Typography>
              </CardContent>
            </Card>

            {/* Total Regulators Card */}
            <Card className="stat-card">
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Total Regulators</Typography>
                <Typography variant="h4" style={{ color: '#673ab7', marginTop: '4px' }}>{totalRegulators}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Policy by Regulators Chart */}
        <Grid item xs={12} md={5}>
          <Card className="chart-card">
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>Distribution By Regulators</Typography>
              <Box style={{ height: 250, position: 'relative', display: 'flex' }}>
                <Box style={{ flex: '1', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regulatorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ value }) => value > 0 ? `${value}` : ''}
                      >
                        {regulatorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box style={{ 
                  width: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '8px',
                  paddingLeft: '16px'
                }}>
                  {REGULATOR_LABELS.map((label, index) => (
                    <Box 
                      key={label} 
                      display="flex" 
                      alignItems="center" 
                      sx={{ 
                        fontSize: '13px',
                        color: '#666',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Box
                        sx={{
                          width: '10px',
                          height: '10px',
                          marginRight: '8px',
                          backgroundColor: COLORS[index],
                          borderRadius: '2px',
                          flexShrink: 0
                        }}
                      />
                      <Typography style={{ fontSize: '13px', color: '#666' }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rule Interpretation by Domain Chart */}
        <Grid item xs={12} md={4}>
          <Card className="chart-card" style={{ overflow: 'visible' }}>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>Policies by Domain</Typography>
              <Box style={{ height: 250, marginRight: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainData}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    barSize={40}
                  >
                    <XAxis dataKey="name" type="category" tickLine={false} axisLine={true} />
                    <YAxis type="number" domain={[0, 30]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#B39DDB" minPointSize={5}>
                      {domainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6495ED' : '#DDA0DD'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const RuleMapping = () => {
  const { data: initialData, loading, error } = useApi(api.getRuleMappings);
  const [data, setData] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { 
    setShowV2Interpretation, 
    showCustomerCommunications, 
    setShowCustomerCommunications,
    hasMappingChanges,
    setHasMappingChanges
  } = useAppContext();
  const [domainCheckboxes, setDomainCheckboxes] = useState({
    operational_resilience: true,
    customer_communications: true
  });
  const [editFormData, setEditFormData] = useState({
    regulation: '',
    policy_code: '',
    policy_document_path: '',
    included: true,
    comments: ''
  });
  const [newMappingDialogOpen, setNewMappingDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({
    regulation: '',
    policy_code: '',
    policy_document_path: '',
    included: true,
    comments: ''
  });
  const [isRunningInterpretation, setIsRunningInterpretation] = useState(false);
  const [interpretationProgress, setInterpretationProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingPolicies, setIsFetchingPolicies] = useState(false);
  const [fetchingProgress, setFetchingProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Add snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Initialize data from initialData when it's loaded
  useEffect(() => {
    if (initialData) {
      // Create a deep copy of the initial data
      const filteredData = JSON.parse(JSON.stringify(initialData));
      
      // Remove Customer Communications policy if it exists and showCustomerCommunications is false
      if (!showCustomerCommunications && filteredData.policies && filteredData.policies.customer_communications) {
        delete filteredData.policies.customer_communications;
      }
      
      setData(filteredData);
    }
  }, [initialData, showCustomerCommunications]);

  // Function to add Customer communications policy
  const addCustomerCommunicationsPolicy = () => {
    if (!initialData || !initialData.policies || !initialData.policies.operational_resilience) return;
    
    // Create a deep copy of the current data
    const updatedData = JSON.parse(JSON.stringify(data));
    
    // Get the operational_resilience policy structure
    const operationalResiliencePolicy = initialData.policies.operational_resilience;
    
    // Check if Customer communications already exists in initialData
    if (initialData.policies.customer_communications) {
      // Use the existing customer_communications from initialData
      updatedData.policies.customer_communications = JSON.parse(
        JSON.stringify(initialData.policies.customer_communications)
      );
      
      // Debug log
      console.log('Using existing Customer Communications policies:', updatedData.policies.customer_communications);
    } else {
      // Create a new Customer communications policy based on operational_resilience
      updatedData.policies.customer_communications = operationalResiliencePolicy.map(regulatorObj => {
        const regulator = Object.keys(regulatorObj)[0];
        const policies = regulatorObj[regulator];
        
        // Create a new regulator object with the same policies but updated paths
        const result = {
          [regulator]: policies.map(policy => ({
            ...policy,
            policy_code: `CC-${policy.policy_code}`,
            policy_document_path: policy.policy_document_path.replace(/\/[^/]+$/, '/customer_communications_policy.pdf')
          }))
        };
        
        // Debug log
        console.log(`Created ${result[regulator].length} Customer Communications policies for ${regulator}`);
        
        return result;
      });
      
      // Debug log
      console.log('Created new Customer Communications policies:', updatedData.policies.customer_communications);
    }
    
    // Update the data state with the new policy
    setData(updatedData);
    
    // Set flag to show Customer Communications
    setShowCustomerCommunications(true);
    
    // Expand the new domain
    setExpandedDomain('customer_communications');
  };

  const handlePreviewOpen = (documentPath, documentName) => {
    setSelectedDocument({ path: documentPath, name: documentName });
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setSelectedDocument(null);
  };

  const handleEditClick = (regulator,mapping) => {
    mapping.regulation = regulator;
    setSelectedMapping(mapping);
    setEditFormData({
      regulation: mapping.regulation,
      policy_code: mapping.policy_code,
      policy_document_path: mapping.policy_document_path,
      included: mapping.included !== false,
      comments: mapping.comments || ''
    });
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setSelectedMapping(null);
  };

  const handleSaveMapping = () => {
    // Create a deep copy of the current data
    const updatedData = JSON.parse(JSON.stringify(data));
    
    // Find the mapping in the data and update it
    if (updatedData && updatedData.policies) {
      Object.entries(updatedData.policies).forEach(([domain, regulators]) => {
        regulators.forEach(regulatorObj => {
          Object.entries(regulatorObj).forEach(([regulator, policies]) => {
            policies.forEach(policy => {
              // Check if this is the policy we're editing
              if (
                regulator === selectedMapping.regulation &&
                policy.policy_code === selectedMapping.policy_code &&
                policy.policy_document_path === selectedMapping.policy_document_path
              ) {
                // Update the policy with the new values
                policy.included = editFormData.included;
                policy.comments = editFormData.comments;
                
                // Debug log
                console.log(`Updated policy ${policy.policy_code} in ${domain}/${regulator}:`, {
                  included: policy.included,
                  comments: policy.comments
                });
              }
            });
          });
        });
      });
      
      // Update the data state with the modified data
      setData(updatedData);
      
      // Force a re-render to update the UI
      setTimeout(() => {
        // This will trigger a re-render
        setData({...updatedData});
      }, 0);
    }
    
    // Here you would typically make an API call to save the changes
    console.log('Saving mapping changes:', {
      mapping: selectedMapping,
      changes: editFormData
    });
    
    setHasMappingChanges(true);
    handleCloseDialog();
  };

  const handleIncludedChange = (event) => {
    setEditFormData({
      ...editFormData,
      included: event.target.checked
    });
  };

  const handleCommentsChange = (event) => {
    setEditFormData({
      ...editFormData,
      comments: event.target.value
    });
  };

  const handleAddNewClick = () => {
    setNewMapping({
      regulation: '',
      policy_code: '',
      policy_document_path: '',
      included: true,
      comments: ''
    });
    setNewMappingDialogOpen(true);
  };

  const handleCloseNewDialog = () => {
    setNewMappingDialogOpen(false);
  };

  const handleSaveNewMapping = () => {
    // Create a deep copy of the current data
    const updatedData = JSON.parse(JSON.stringify(data));
    
    // Check if the data structure exists
    if (!updatedData || !updatedData.policies) {
      console.error('Data structure is not valid');
      return;
    }
    
    // Get the domain and regulator from the new mapping
    const { regulation, policy_code, policy_document_path, included, comments } = newMapping;
    
    // Determine which domain to add the mapping to based on the policy_document_path
    let targetDomain = 'operational_resilience'; // Default domain
    if (policy_document_path.includes('customer_communications')) {
      targetDomain = 'customer_communications';
    }
    
    // Check if the domain exists
    if (!updatedData.policies[targetDomain]) {
      updatedData.policies[targetDomain] = [];
    }
    
    // Check if the regulator exists in the domain
    let regulatorObj = updatedData.policies[targetDomain].find(obj => regulation in obj);
    
    if (!regulatorObj) {
      // Create a new regulator object if it doesn't exist
      regulatorObj = { [regulation]: [] };
      updatedData.policies[targetDomain].push(regulatorObj);
    }
    
    // Add the new policy to the regulator
    regulatorObj[regulation].push({
      policy_code,
      policy_document_path,
      included,
      comments
    });
    
    // Update the data state with the modified data
    setData(updatedData);
    
    // Here you would typically make an API call to save the new mapping
    console.log('Saving new mapping:', newMapping);
    
    setHasMappingChanges(true);
    handleCloseNewDialog();
  };

  const handleNewMappingChange = (field) => (event) => {
    setNewMapping({
      ...newMapping,
      [field]: event.target.value
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('policyFile', file);
      
      // Here you would make an API call to upload the file
      // For example:
      // await api.uploadPolicyDocument(formData);
      
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Replace alert with snackbar
      setSnackbarMessage(`Policy document "${file.name}" uploaded successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Start the "Fetching relevant policies" progress
      setIsFetchingPolicies(true);
      setFetchingProgress(0);
      
      // Simulate progress over 1 minute (60 seconds)
      const totalDuration = 60000; // 60 seconds in milliseconds
      const updateInterval = 1000; // Update every second
      const incrementPerUpdate = 100 / (totalDuration / updateInterval);
      
      const progressInterval = setInterval(() => {
        setFetchingProgress(prevProgress => {
          const newProgress = prevProgress + incrementPerUpdate;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, updateInterval);
      
      // After 1 minute, clear the interval and finish
      setTimeout(() => {
        clearInterval(progressInterval);
        setFetchingProgress(100);
        
        // Show success message with Snackbar
        setSnackbarMessage('Relevant policies fetched successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Wait a bit to show 100% completion, then reset
        setTimeout(() => {
          setIsFetchingPolicies(false);
          setFetchingProgress(0);
          // Add Customer communications policy
          addCustomerCommunicationsPolicy();
          // Enable the Run Rule Interpretation button after fetching is complete
          setHasMappingChanges(true);
        }, 1000);
      }, totalDuration);
      
    } catch (error) {
      // Show error message with Snackbar instead of alert
      setSnackbarMessage('Failed to upload policy document: ' + (error.message || 'Unknown error'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleRunInterpretation = async () => {
    try {
      setIsRunningInterpretation(true);
      setInterpretationProgress(0);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setInterpretationProgress((oldProgress) => {
          // Slowly increase progress up to 90%
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 90);
        });
      }, 3000);

      await api.runRuleInterpretation();
      
      // Clear interval and set to 100% when complete
      clearInterval(progressInterval);
      setInterpretationProgress(100);
      
      // Show success message with Snackbar instead of alert
      setSnackbarMessage('Rule interpretation completed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reset the changes flag after successful interpretation
      setHasMappingChanges(false);
      
      // Show version 2 in the Rule Interpretation page
      setShowV2Interpretation(true);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setInterpretationProgress(0);
      }, 1000);
    } catch (error) {
      // Show error message with Snackbar instead of alert
      setSnackbarMessage('Failed to run rule interpretation: ' + (error.message || 'Unknown error'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setInterpretationProgress(0);
    } finally {
      setIsRunningInterpretation(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading && !data) {
    return (
      <div className="loading-container">
        <CircularProgress style={{ color: '#673ab7' }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  const handleDomainChange = (domain) => (event, isExpanded) => {
    setExpandedDomain(isExpanded ? domain : '');
  };

  const handleDomainCheckboxChange = (domain) => (event) => {
    event.stopPropagation(); // Prevent accordion from toggling
    setDomainCheckboxes({
      ...domainCheckboxes,
      [domain]: event.target.checked
    });
  };

  return (
    <div className="content-area">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '2.2rem' }}>Rule Mapping</h1>
      </div>

      <div className="rule-mapping-container">
        <Box sx={{ mb: 1 }}>
          <Dashboard data={data} showCustomerCommunications={showCustomerCommunications} />
        </Box>
        
        <Box className="mapping-actions">
          <Button
            variant="contained"
            className="run-interpretation-button"
            startIcon={<PlayArrowIcon style={{ fontSize: 18 }} />}
            onClick={handleRunInterpretation}
            disabled={!hasMappingChanges || isRunningInterpretation || isFetchingPolicies}
            size="small"
          >
            Run Rule Interpretation
          </Button>
          <Button
            variant="contained"
            className="upload-policy-button"
            startIcon={<CloudUploadIcon style={{ fontSize: 18 }} />}
            onClick={handleUploadClick}
            disabled={isUploading}
            size="small"
            style={{ marginLeft: '10px' }}
          >
            Upload New Policy
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.doc,.txt"
          />
          <Button
            variant="contained"
            className="add-mapping-button"
            startIcon={<AddIcon style={{ fontSize: 18 }} />}
            onClick={handleAddNewClick}
            size="small"
          >
            Add New Mapping
          </Button>
        </Box>

        {isUploading && (
          <div className="upload-progress">
            <Typography variant="body2" color="textSecondary" className="progress-text">
              Uploading policy document...
            </Typography>
            <LinearProgress className="progress-bar" />
          </div>
        )}

        {isFetchingPolicies && (
          <div className="fetching-progress">
            <Typography variant="body2" color="textSecondary" className="progress-text">
              Fetching relevant policies... {Math.round(fetchingProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={fetchingProgress} 
              className="progress-bar"
            />
          </div>
        )}

        {isRunningInterpretation && (
          <div className="interpretation-progress">
            <Typography variant="body2" color="textSecondary" className="progress-text">
              Running Rule Interpretation... {Math.round(interpretationProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={interpretationProgress} 
              className="progress-bar"
            />
          </div>
        )}

        {Object.entries(data?.policies || {}).map(([domain, regulators]) => (
          (domain === 'customer_communications' && !showCustomerCommunications) ? null : (
            <Accordion 
              key={domain}
              expanded={expandedDomain === domain}
              onChange={handleDomainChange(domain)}
              className="domain-accordion"
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                className="domain-summary"
              >
                <Box display="flex" alignItems="center" width="100%">
                  <Checkbox 
                    checked={domainCheckboxes[domain] || false} 
                    onClick={(e) => e.stopPropagation()} 
                    onChange={handleDomainCheckboxChange(domain)}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="h6" className="domain-title">
                    {domain.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} className="table-container">
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell className="header-cell">Regulator</TableCell>
                        <TableCell className="header-cell">Policy Code</TableCell>
                        <TableCell className="header-cell">Document Path</TableCell>
                        <TableCell className="header-cell">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regulators.map((regulatorObj, index) => 
                        Object.entries(regulatorObj).map(([regulator, policies]) =>
                          policies.map((policy, policyIndex) => (
                            <TableRow 
                              key={`${index}-${policyIndex}`}
                              hover
                              className="mapping-row"
                            >
                              <TableCell>
                                <Chip 
                                  label={regulator}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={policy.policy_code}
                                  className="policy-chip"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" className="document-path">
                                  {policy.policy_document_path.split('/').pop()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <div className="action-buttons">
                                  <Button
                                    startIcon={<VisibilityIcon />}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handlePreviewOpen(
                                      policy.policy_document_path,
                                      policy.policy_document_path.split('/').pop()
                                    )}
                                  >
                                    Preview
                                  </Button>
                                  <Button
                                    startIcon={<EditIcon />}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleEditClick(regulator,policy)}
                                    className="edit-button"
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )
        ))}
      </div>

      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="lg"
        fullWidth
        className="preview-dialog"
      >
        <DialogTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedDocument?.name}
            </Typography>
            <IconButton onClick={handlePreviewClose} size="small">
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <iframe
            src={`${process.env.PUBLIC_URL}${selectedDocument?.path?.replace('../', '/')}`}
            title="Document Preview"
            style={{ width: '100%', height: '80vh', border: 'none' }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Rule Mapping
        </DialogTitle>
        <DialogContent>
          {selectedMapping && (
            <div className="edit-dialog-content">
              <div className="mapping-details">
                <div className="info-field">
                  <Typography variant="caption" color="textSecondary">
                    Regulator
                  </Typography>
                  <Typography variant="body1">
                    {selectedMapping.regulation}
                  </Typography>
                </div>
                
                <div className="info-field">
                  <Typography variant="caption" color="textSecondary">
                    Policy Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedMapping.policy_code}
                  </Typography>
                </div>
                
                <div className="info-field">
                  <Typography variant="caption" color="textSecondary">
                    Document Path
                  </Typography>
                  <Typography variant="body1" className="document-path">
                    {selectedMapping.policy_document_path}
                  </Typography>
                </div>
              </div>

              <div className="edit-form">
                <div className="include-checkbox">
                  <Checkbox
                    checked={editFormData.included}
                    onChange={handleIncludedChange}
                    color="primary"
                  />
                  <Typography>Include this mapping</Typography>
                </div>

                <TextField
                  label="Comments"
                  multiline
                  rows={4}
                  value={editFormData.comments}
                  onChange={handleCommentsChange}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMapping} 
            color="primary" 
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newMappingDialogOpen}
        onClose={handleCloseNewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Rule Mapping
        </DialogTitle>
        <DialogContent>
          <div className="new-mapping-form">
            <FormControl fullWidth margin="normal">
              <InputLabel>Regulator</InputLabel>
              <Select
                value={newMapping.regulation}
                onChange={handleNewMappingChange('regulation')}
                label="Regulator"
              >
                <MenuItem value="FCA">FCA</MenuItem>
                <MenuItem value="PRA">PRA</MenuItem>
                {/* Add other regulators as needed */}
              </Select>
            </FormControl>
            
            <TextField
              label="Policy Code"
              value={newMapping.policy_code}
              onChange={handleNewMappingChange('policy_code')}
              fullWidth
              margin="normal"
            />
            
            <TextField
              label="Document Path"
              value={newMapping.policy_document_path}
              onChange={handleNewMappingChange('policy_document_path')}
              fullWidth
              margin="normal"
            />
            
            <div className="include-checkbox">
              <Checkbox
                checked={newMapping.included}
                onChange={(e) => setNewMapping({
                  ...newMapping,
                  included: e.target.checked
                })}
                color="primary"
              />
              <Typography>Include this mapping</Typography>
            </div>
            
            <TextField
              label="Comments"
              multiline
              rows={4}
              value={newMapping.comments}
              onChange={handleNewMappingChange('comments')}
              fullWidth
              margin="normal"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNewMapping} 
            color="primary" 
            variant="contained"
            disabled={!newMapping.regulation || !newMapping.policy_code}
          >
            Save Mapping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Snackbar component at the end of the return statement */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RuleMapping; 