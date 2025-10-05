import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import './RuleInterpretation.css';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import regulationMapping from '../data/regulation_mapping/regulation_mapping.json';
import { useAppContext } from '../context/AppContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './RuleMapping.css';

const Dashboard = ({ data, showCustomerCommunications, version }) => {
  // Process data for charts
  const processData = () => {
    const stats = {
      byDomain: [],
      byRegulator: {},
      totalTestCases: 0,
      totalPolicies: 0
    };

    // For version 1, we want to ensure it only shows Operational Resilience with fixed stats
    if (version === 'v1') {
      // Add only Operational Resilience domain with fixed stats
      stats.byDomain.push({
        name: 'OPERATIONAL RESILIENCE',
        testCases: 78,
        policies: 6
      });
      
      // Set fixed regulator data for version 1
      stats.byRegulator = {
        'FCA': 29,
        'PRA': 49
      };
      
      // Set fixed totals for version 1
      stats.totalTestCases = 78;
      stats.totalPolicies = 6;
      
      return stats;
    }
    
    // For version 2, we need to adjust the counts to reflect 8 fewer FCA rules
    if (version === 'v2') {
      // Calculate total test cases and policies
      const totalTestCases = 241 - 8; // 233 total test cases (8 fewer FCA rules)
      
      // Add domains with adjusted stats
      stats.byDomain.push({
        name: 'OPERATIONAL RESILIENCE',
        testCases: 78 - 8, // 70 test cases (8 fewer FCA rules)
        policies: 5
      });
      
      stats.byDomain.push({
        name: 'CUSTOMER COMMUNICATIONS',
        testCases: 163,
        policies: 20 // Changed from 13 to 12 to make total 25
      });
      
      // Set adjusted regulator data for version 2
      stats.byRegulator = {
        'FCA': 140 - 8, // 132 (8 fewer FCA rules)
        'PRA': 49,
        'ASA': 20,
        'FSMA': 15,
        'LSB': 10,
        'ECR': 7
      };
      
      // Set adjusted totals for version 2
      stats.totalTestCases = totalTestCases;
      stats.totalPolicies = 25; // Changed from 26 to 25
      
      return stats;
    }

    // For other versions, process data normally
    Object.entries(data?.Regulation_interpretation || {}).forEach(([domain, regulations]) => {
      // Skip Customer Communications domain if not showing it
      if (!showCustomerCommunications && domain === 'customer_communications') {
        return;
      }

      let domainTestCases = 0;
      let domainPolicies = 0;

      Object.entries(regulations).forEach(([regulator, policies]) => {
        // Skip regulators other than FCA and PRA if not showing Customer Communications
        if (!showCustomerCommunications && regulator !== 'FCA' && regulator !== 'PRA') {
          return;
        }

        if (!stats.byRegulator[regulator]) {
          stats.byRegulator[regulator] = 0;
        }

        policies.forEach(policy => {
          domainTestCases += policy.policy_test_cases.length;
          domainPolicies += 1;
          stats.byRegulator[regulator] += policy.policy_test_cases.length;
        });
      });

      stats.byDomain.push({
        name: domain.replace(/_/g, ' ').toUpperCase(),
        testCases: domainTestCases,
        policies: domainPolicies
      });

      stats.totalTestCases += domainTestCases;
      stats.totalPolicies += domainPolicies;
    });

    return stats;
  };

  const stats = processData();
  
  // Use blue colors for version 1, regular colors for other versions
  const COLORS = version === 'v1' 
    ? ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']// Different shades of blue for version 1
    : ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Original colors for other versions

  const regulatorData = Object.entries(stats.byRegulator).map(([name, value]) => ({
    name,
    value
  }));

  // Primary color based on version
  const primaryColor = version === 'v1' ? '#1E90FF' : '#673ab7';
  
  // Get regulator labels dynamically
  const REGULATOR_LABELS = Object.keys(stats.byRegulator);
  
  // Format domain data for the bar chart
  const domainData = stats.byDomain.map(domain => ({
    name: domain.name,
    value: domain.testCases
  }));

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
                <Typography variant="h4" style={{ color: primaryColor, marginTop: '4px' }}>{stats.totalPolicies}</Typography>
              </CardContent>
            </Card>

            {/* Total Rule Interpretations Card */}
            <Card className="stat-card">
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Total Rule Interpretations</Typography>
                <Typography variant="h4" style={{ color: primaryColor, marginTop: '4px' }}>{stats.totalTestCases}</Typography>
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
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>Rule Interpretation by Domain</Typography>
              <Box style={{ height: 250, marginRight: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={domainData}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    barSize={40}
                  >
                    <XAxis dataKey="name" type="category" tickLine={false} axisLine={true} />
                    <YAxis type="number" domain={[0, 200]} />
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

const VersionComparisonDashboard = ({ versions }) => {
  const getVersionStats = (data, version) => {
    // For version 1, return fixed stats
    if (version === 'v1') {
      return {
        testCases: 78,
        policies: 6,
        regulators: 2,
        domains: 1
      };
    }
    
    // For version 2, return adjusted stats with 8 fewer FCA rules
    if (version === 'v2') {
      return {
        testCases: 241 - 8, // 233 total test cases (8 fewer FCA rules)
        policies: 25,
        regulators: 6,
        domains: 2
      };
    }

    let stats = {
      testCases: 0,
      policies: 0,
      regulators: 0,
      domains: 0
    };

    Object.entries(data?.Regulation_interpretation || {}).forEach(([domain, regulations]) => {
      stats.domains += 1;
      
      Object.entries(regulations).forEach(([regulator, policies]) => {
        if (!stats.regulators) stats.regulators = new Set();
        stats.regulators.add(regulator);
        
        policies.forEach(policy => {
          stats.testCases += policy.policy_test_cases.length;
          stats.policies += 1;
        });
      });
    });

    stats.regulators = stats.regulators.size;
    return stats;
  };

  // Get stats for each version
  const versionStats = versions.map(version => ({
    version: version.version,
    date: version.date,
    stats: getVersionStats(version.data, version.version)
  }));

  // Sort by date
  versionStats.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Format data for line charts
  const chartData = versionStats.map(version => {
    // Format the date correctly for version 2
    let displayDate = version.date;
    if (version.version === 'v2') {
      displayDate = '2025-03-07T00:00:00.000Z';
    }
    
    return {
      name: `${version.version}`,
      testCases: version.stats.testCases,
      policies: version.stats.policies,
      regulators: version.stats.regulators,
      domains: version.stats.domains,
      date: displayDate,
      color: version.version === "v1" ? "#1E90FF" : "#ec4899",
      versionNumber: version.version.replace('v', '')
    };
  });

  // Debug log
  console.log("Chart Data with Colors:", chartData);

  const renderVersionBox = (version) => {
    // Format the date correctly for version 2
    let displayDate = version.date;
    if (version.version === 'v2') {
      displayDate = '2025-03-07T00:00:00.000Z';
    }
    
    // Define colors for version 1
    const v1BorderColor = "#4682B4"; // Steel Blue
    const v1BadgeColor = "#B0E0E6"; // Powder Blue
    const v1TextColor = "#0066CC"; // Darker Blue for text
    
    return (
      <Card className="version-box" style={{ 
        borderTop: `4px solid ${version.version === "v1" ? v1BorderColor : "#ec4899"}`
      }}>
        <CardContent className="version-box-content">
          <div className="version-header-container">
            <div className="version-badge" style={{ 
              backgroundColor: version.version === "v1" ? v1BadgeColor : "#FFCCE5" // Light pink for version 2
            }}>
              <Typography variant="h6" className="version-title" style={{
                color: version.version === "v1" ? v1TextColor : "inherit"
              }}>
                Version {version.version.replace('v', '')}
              </Typography>
            </div>
            <Typography variant="caption" color="textSecondary" className="version-date">
              {new Date(displayDate).toLocaleDateString()}
            </Typography>
          </div>
          
          <div className="version-stats-container">
            <Typography variant="body2" className="stat-line">
              <strong className="stat-label" style={{
                color: version.version === "v1" ? v1TextColor : "inherit"
              }}>Test Cases:</strong> {version.stats.testCases}
            </Typography>
            <Typography variant="body2" className="stat-line">
              <strong className="stat-label" style={{
                color: version.version === "v1" ? v1TextColor : "inherit"
              }}>Policies:</strong> {version.stats.policies}
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBarChart = (dataKey, title, color) => {
    // Define explicit colors for each version
    const VERSION_COLORS = {
      "v1": "#4682B4", // Steel Blue for Version 1 (updated)
      "v2": "#ec4899"  // Pink for Version 2
    };
    
    return (
      <Card className="chart-box">
        <CardContent>
          <Typography variant="h6" className="chart-title" gutterBottom>
            {title}
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="versionNumber"
                tick={{ fontSize: 12 }}
                height={20}
                tickFormatter={(value) => `V${value}`}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                width={35}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const version = label;
                    return (
                      <div className="custom-tooltip">
                        <p className="tooltip-label">{`Version ${version}`}</p>
                        <p className="tooltip-value">
                          {`${title}: ${payload[0].value}`}
                        </p>
                        <p className="tooltip-date">
                          {new Date(chartData.find(d => d.versionNumber === version)?.date).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey={dataKey} 
                name={title}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => {
                  console.log(`Bar ${index} - Version: ${entry.name}, Color: ${VERSION_COLORS[entry.name]}`);
                  return (
                    <Cell 
                      key={`cell-${index}`}
                      fill={VERSION_COLORS[entry.name]}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="version-comparison-dashboard">
      {/* Version boxes in horizontal layout */}
      <Grid container spacing={3} sx={{ mb: 3 }} justifyContent="flex-start">
        {versionStats.map((version, index) => (
          <Grid item xs={6} sm={4} md={3} key={version.version}>
            {renderVersionBox(version)}
          </Grid>
        ))}
      </Grid>

      {/* Charts in horizontal layout */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          {renderBarChart('testCases', 'Test Cases', '#8884d8')}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderBarChart('policies', 'Policies', '#82ca9d')}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderBarChart('regulators', 'Regulators', '#ffc658')}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderBarChart('domains', 'Domains', '#ff7300')}
        </Grid>
      </Grid>
    </div>
  );
};

const loadPDFWithSearch = async (pdfPath, searchText) => {
  console.log('loadPDFWithSearch called with:', { pdfPath, searchText });
  
  const pdfContainer = document.getElementById("pdf-container");
  if (!pdfContainer) {
    console.error('PDF container not found');
    return;
  }

  pdfContainer.innerHTML = '';
  console.log('PDF container cleared');

  try {
    console.log('Loading PDF document:', pdfPath);
    const loadingTask = window.pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;
    console.log('PDF loaded with', pdf.numPages, 'pages');
    
    let searchFound = false;
    const pageWrappers = []; // Store all page wrappers for later scrolling

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log('Processing page', pageNum);
      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.marginBottom = "20px";
      wrapper.dataset.pageNum = pageNum; // Store page number in dataset
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      wrapper.appendChild(canvas);
      pdfContainer.appendChild(wrapper);
      pageWrappers.push(wrapper); // Add to array for later reference

      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      console.log('Page', pageNum, 'rendered');

      // Get text content and search
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => item.str).join(" ");
      console.log('Page', pageNum, 'text content length:', textItems.length);
      
      // Only search if searchText is not empty
      if (searchText && searchText.trim() !== '') {
        console.log('Searching for:', searchText, 'in page', pageNum);
        const searchLower = searchText.toLowerCase();
        const textLower = textItems.toLowerCase();
        const found = textLower.includes(searchLower);
        console.log('Search result for page', pageNum, ':', found);
        
        if (found && !searchFound) {
          searchFound = true;
          console.log('Search text found on page', pageNum);
          
          // Add page number indicator
          const pageIndicator = document.createElement("div");
          pageIndicator.style.position = "absolute";
          pageIndicator.style.top = "10px";
          pageIndicator.style.right = "10px";
          pageIndicator.style.background = "#ffeb3b";
          pageIndicator.style.padding = "5px 10px";
          pageIndicator.style.borderRadius = "4px";
          pageIndicator.innerHTML = `Found on Page ${pageNum}`;
          wrapper.appendChild(pageIndicator);
          
          // Mark this wrapper for scrolling
          wrapper.dataset.foundText = "true";
        }
      }

      // Always add page number
      const pageNumLabel = document.createElement("div");
      pageNumLabel.style.textAlign = "center";
      pageNumLabel.style.marginTop = "5px";
      pageNumLabel.innerHTML = `Page ${pageNum}`;
      wrapper.appendChild(pageNumLabel);
    }

    // Only show not found message if searchText is not empty
    if (!searchFound && searchText && searchText.trim() !== '') {
      console.log('Search text not found in document:', searchText);
      const notFoundMsg = document.createElement("div");
      notFoundMsg.style.padding = "20px";
      notFoundMsg.style.color = "red";
      notFoundMsg.innerHTML = `Search text "${searchText}" not found in document`;
      pdfContainer.insertBefore(notFoundMsg, pdfContainer.firstChild);
    }
    
    // Scroll to the found page after all pages are rendered
    if (searchFound) {
      setTimeout(() => {
        const foundWrapper = pageWrappers.find(wrapper => wrapper.dataset.foundText === "true");
        if (foundWrapper) {
          console.log('Scrolling to page', foundWrapper.dataset.pageNum);
          foundWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }

  } catch (error) {
    console.error('Error loading PDF:', error);
    pdfContainer.innerHTML = '<div style="color: red; padding: 20px;">Error loading PDF document</div>';
  }
};

const RuleInterpretation = () => {
  const { data: versionsData, loading: versionsLoading, error: versionsError } = useApi(api.getRuleInterpretations);
  const { showV2Interpretation } = useAppContext();
  const [expandedVersion, setExpandedVersion] = useState('');
  const [expandedDomain, setExpandedDomain] = useState('');
  const [expandedRegulator, setExpandedRegulator] = useState('');
  const [openSourceDialog, setOpenSourceDialog] = useState(false);
  const [selectedSourcePath, setSelectedSourcePath] = useState('');
  const [selectedPolicyCode, setSelectedPolicyCode] = useState('');
  const [selectedCitation, setSelectedCitation] = useState('');
  const [isRunningAssessment, setIsRunningAssessment] = useState(false);
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Modify version 2 date to 07/03/2025
  useEffect(() => {
    if (versionsData && versionsData.versions) {
      // Create a deep copy of the versions data to avoid modifying the original object directly
      const updatedVersions = JSON.parse(JSON.stringify(versionsData.versions));
      
      // Find and update version 2 date
      const v2Index = updatedVersions.findIndex(v => v.version === 'v2');
      if (v2Index !== -1) {
        // Set the date to March 7, 2025
        updatedVersions[v2Index].date = '2025-03-07T00:00:00.000Z';
        
        // Update the versionsData object with the modified versions
        versionsData.versions = updatedVersions;
      }
    }
  }, [versionsData]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (versionsLoading) {
    return (
      <div className="loading-container">
        <CircularProgress style={{ color: '#673ab7' }} />
      </div>
    );
  }

  if (versionsError) {
    return (
      <div className="error-container">
        <Typography color="error">
          Error loading rule interpretations: {versionsError.message}
        </Typography>
      </div>
    );
  }

  const handleVersionChange = (version) => (event, isExpanded) => {
    setExpandedVersion(isExpanded ? version : '');
  };

  const handleDomainChange = (domain) => (event, isExpanded) => {
    setExpandedDomain(isExpanded ? domain : '');
  };

  const handleRegulatorChange = (regulator) => (event, isExpanded) => {
    setExpandedRegulator(isExpanded ? regulator : '');
  };

  const handleViewSource = async (domain, regulator, policyCode, citation) => {
    console.log('handleViewSource called with:', { domain, regulator, policyCode, citation });
    
    const policies = regulationMapping.policies[domain.toLowerCase()]?.find(
      reg => reg[regulator]
    )?.[regulator] || [];
    
    console.log('Found policies:', policies);
    
    const policyDoc = policies.find(p => p.policy_code === policyCode.toLowerCase());
    console.log('Found policy document:', policyDoc);
    
    if (policyDoc) {
      setSelectedSourcePath(policyDoc.policy_document_path);
      setSelectedPolicyCode(policyCode);
      setSelectedCitation(citation || ''); // Handle undefined citation
      setOpenSourceDialog(true);

      // Give the dialog time to open before loading the PDF
      setTimeout(() => {
        console.log('Loading PDF with search:', policyDoc.policy_document_path, citation);
        // Always pass the citation to search, even if it's null or undefined
        // The loadPDFWithSearch function will handle empty search text
        loadPDFWithSearch(policyDoc.policy_document_path, citation || '');
      }, 100);
    } else {
      console.error('Policy document not found for:', { domain, regulator, policyCode });
      alert('Policy document not found. Please check the document path.');
    }
  };

  const handleRunAssessment = async () => {
    try {
      setIsRunningAssessment(true);
      setAssessmentProgress(0);
      setAssessmentCompleted(false);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setAssessmentProgress((oldProgress) => {
          // Slowly increase progress up to 90%
          const diff = Math.random() * 5;
          return Math.min(oldProgress + diff, 90);
        });
      }, 1000);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Clear interval and set to 100% when complete
      clearInterval(progressInterval);
      setAssessmentProgress(100);
      
      // Show success message with Snackbar instead of alert
      setSnackbarMessage('Assessment completed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Mark assessment as completed
      setAssessmentCompleted(true);
      
      // Reset progress after a short delay but keep isRunningAssessment true
      setTimeout(() => {
        setAssessmentProgress(0);
        setIsRunningAssessment(false);
        // We don't reset assessmentCompleted here to keep the button disabled
      }, 1500);
    } catch (error) {
      // Show error message with Snackbar
      setSnackbarMessage('Failed to run assessment: ' + (error.message || 'Unknown error'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setAssessmentProgress(0);
      setIsRunningAssessment(false);
      setAssessmentCompleted(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const sourceDialog = (
    <Dialog
      open={openSourceDialog}
      onClose={() => setOpenSourceDialog(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Source Document - {selectedPolicyCode}</Typography>
            {selectedCitation && (
              <Typography variant="subtitle2" color="textSecondary">
                Citation: {selectedCitation}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setOpenSourceDialog(false)}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div id="pdf-container" style={{ width: '100%', minHeight: '80vh' }}></div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="content-area">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '2.2rem' }}>Rule Interpretation</h1>
        <Button
          variant="contained"
          color="primary"
          disabled={!showV2Interpretation || isRunningAssessment || assessmentCompleted}
          onClick={handleRunAssessment}
          style={{ marginRight: '20px' }}
          startIcon={<PlayArrowIcon />}
        >
          Run Assessment
        </Button>
      </div>

      {isRunningAssessment && (
        <div className="interpretation-progress">
          <Typography variant="body2" color="textSecondary" className="progress-text">
            Running Assessment... {Math.round(assessmentProgress)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={assessmentProgress} 
            className="progress-bar"
          />
        </div>
      )}
      
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

      <VersionComparisonDashboard versions={
        showV2Interpretation 
          ? versionsData?.versions || []
          : (versionsData?.versions || []).filter(v => v.version === 'v1')
      } />

      <div className="versions-container">
        {(showV2Interpretation 
          ? versionsData?.versions || []
          : (versionsData?.versions || []).filter(v => v.version === 'v1')
        ).map((version) => (
          <Accordion
            key={version.version}
            expanded={expandedVersion === version.version}
            onChange={handleVersionChange(version.version)}
            className="version-accordion"
            sx={{
              borderLeft: version.version === 'v1' ? '4px solid #ec4899' : undefined,
              '& .MuiAccordionSummary-root': {
                backgroundColor: version.version === 'v1' ? '#FDF2F8' : undefined
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className="version-summary"
            >
              <div className="version-header">
                <Typography 
                  variant="h6" 
                  className="version-dropdown-title"
                  sx={{
                    color: version.version === 'v1' ? '#ec4899' : undefined
                  }}
                >
                  <strong>Version {version.version.replace('v', '')}</strong>
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  {version.version === 'v2' 
                    ? new Date('2025-03-07T00:00:00.000Z').toLocaleDateString() 
                    : new Date(version.date).toLocaleDateString()
                  }
                </Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <div className="version-content">
                <Dashboard data={version.data} showCustomerCommunications={true} version={version.version} />
                
                <div className="interpretations-list">
                  {Object.entries(version.data?.Regulation_interpretation || {}).map(([domain, regulations]) => (
                    // For version 1, only show operational_resilience domain
                    (version.version === 'v1' && domain !== 'operational_resilience') ? null : (
                      <Accordion
                        key={domain}
                        expanded={expandedDomain === domain}
                        onChange={handleDomainChange(domain)}
                        className="domain-accordion"
                        sx={{
                          borderLeft: version.version === 'v1' ? '3px solid #ec4899' : undefined,
                          '& .MuiAccordionSummary-root': {
                            backgroundColor: version.version === 'v1' ? '#FDF2F8' : undefined
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          className="domain-summary"
                        >
                          <Typography 
                            variant="h6" 
                            className="domain-title"
                            sx={{
                              color: version.version === 'v1' ? '#ec4899' : undefined
                            }}
                          >
                            {domain.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {Object.entries(regulations).map(([regulator, policies]) => (
                            <Accordion
                              key={regulator}
                              expanded={expandedRegulator === regulator}
                              onChange={handleRegulatorChange(regulator)}
                              className="regulator-accordion"
                              sx={{
                                borderLeft: version.version === 'v1' ? '2px solid #ec4899' : undefined,
                                '& .MuiAccordionSummary-root': {
                                  backgroundColor: version.version === 'v1' ? '#FDF2F8' : undefined
                                }
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                className="regulator-summary"
                              >
                                <Typography 
                                  variant="subtitle1" 
                                  className="regulator-title"
                                  sx={{
                                    color: version.version === 'v1' ? '#ec4899' : undefined
                                  }}
                                >
                                  {regulator} Regulations
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                {policies.map((policy, idx) => (
                                  <Box key={idx} className="policy-section">
                                    <TableContainer component={Paper} className="table-container">
                                      <Table stickyHeader>
                                        <TableHead>
                                          <TableRow>
                                            <TableCell className="header-cell" align="center" width="10%">S.No</TableCell>
                                            <TableCell className="header-cell" align="center" width="15%">Policy Code</TableCell>
                                            <TableCell className="header-cell" width="30%">Regulation Rule</TableCell>
                                            <TableCell className="header-cell" width="30%">Rule Interpretation</TableCell>
                                            <TableCell className="header-cell" align="center" width="15%">Citations</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {policy.policy_test_cases.map((testCase, testIdx) => {
                                            //const fullMatches = testCase.similar_rules.filter(rule => rule.match_type === 'full');
                                            return (
                                              <TableRow 
                                                key={testIdx}
                                                hover
                                                className="interpretation-row"
                                              >
                                                <TableCell align="center" className="test-case-cell">
                                                  <Chip 
                                                    label={testCase['Test case no']}
                                                    color="primary"
                                                    variant="outlined"
                                                    size="small"
                                                  />
                                                </TableCell>
                                                <TableCell align="center">
                                                  <Chip 
                                                    label={policy.policy_code}
                                                    className="policy-chip"
                                                    size="small"
                                                  />
                                                </TableCell>
                                                
                                                <TableCell>
                                                  <Typography variant="body2" className="excerpt">
                                                    {testCase.Excerpt}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell>
                                                  <Typography variant="body2" className="test-description">
                                                    {testCase['Test case']}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                  <Box className="citations">
                                                    {testCase['rule citation'].map((citation, idx) => (
                                                      <Chip 
                                                        key={idx} 
                                                        label={citation} 
                                                        size="small" 
                                                        className="citation-chip"
                                                        onClick={() => handleViewSource(domain, regulator, policy.policy_code, citation)}
                                                        clickable
                                                      />
                                                    ))}
                                                    <Button
                                                      size="small"
                                                      startIcon={<DescriptionIcon />}
                                                      onClick={() => handleViewSource(domain, regulator, policy.policy_code, testCase['rule citation'] && testCase['rule citation'].length > 0 ? testCase['rule citation'][0] : null)}
                                                      className="view-source-btn"
                                                    >
                                                      View Source
                                                    </Button>
                                                  </Box>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Box>
                                ))}
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )
                  ))}
                </div>
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
      {sourceDialog}
    </div>
  );
};

export default RuleInterpretation; 