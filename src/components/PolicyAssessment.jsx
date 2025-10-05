import React, { useState, useEffect } from 'react';
import {
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import './PolicyAssessment.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import regulationMapping from '../data/regulation_mapping/regulation_mapping.json';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useAppContext } from '../context/AppContext';

const loadPdfJS = () => {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
  script.async = true;
  script.onload = () => {
    // Set the worker source after the script has loaded
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  };
  document.body.appendChild(script);
};

const PolicyAssessment = () => {
  const { data, loading, error } = useApi(api.getPolicyAssessment);
  const { showV2Interpretation } = useAppContext();
  const [expandedDomain, setExpandedDomain] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [sourceDocument, setSourceDocument] = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [dialogState, setDialogState] = useState({
    open: false,
    pdfPath: '',
    secondaryPdfPath: '',
    alternativeSecondaryPath: '',
    searchText: '',
    secondarySearchText: '',
    title: ''
  });
  
  // Add version state - default to v1 if assessment not completed, v2 if completed
  const [selectedVersion, setSelectedVersion] = useState(showV2Interpretation ? 'v2' : 'v1');
  
  // Update selectedVersion when showV2Interpretation changes
  useEffect(() => {
    setSelectedVersion(showV2Interpretation ? 'v2' : 'v1');
  }, [showV2Interpretation]);
  
  // Define versions data
  const versionsData = [
    {
      version: 'v1',
      name: 'Version 1',
      date: '2025-03-04T00:00:00.000Z',
      description: 'Initial assessment without Customer Communications domain'
    },
    {
      version: 'v2',
      name: 'Version 2',
      date: '2025-03-07T00:00:00.000Z',
      description: 'Complete assessment with all domains'
    }
  ];

  useEffect(() => {
    loadPdfJS();
  }, []);

  const loadPDFWithSearch = async (pdfPath, searchText, containerId = "pdf-container") => {
    const pdfContainer = document.getElementById(containerId);
    if (!pdfContainer) {
      console.error(`PDF container with ID "${containerId}" not found`);
      return Promise.reject(new Error(`PDF container with ID "${containerId}" not found`));
    }

    pdfContainer.innerHTML = '';
    
    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.style.padding = "20px";
    loadingIndicator.style.textAlign = "center";
    loadingIndicator.innerHTML = `<div>Loading PDF...</div>`;
    pdfContainer.appendChild(loadingIndicator);

    try {
      console.log(`Attempting to load PDF from path: ${pdfPath}`);
      
      // Check if pdfjsLib is available
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library not loaded. Please refresh the page and try again.');
      }
      
      // Create a full URL for the PDF
      const baseUrl = window.location.origin;
      const fullPdfUrl = pdfPath.startsWith('/') 
        ? `${baseUrl}${pdfPath}` 
        : `${baseUrl}/${pdfPath}`;
      
      console.log(`Full PDF URL: ${fullPdfUrl}`);
      
      // Try to fetch the PDF first to check if it exists
      const response = await fetch(fullPdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the PDF as an ArrayBuffer
      const pdfData = await response.arrayBuffer();
      
      // Load the PDF from the ArrayBuffer
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
      
      // Clear the loading indicator once the PDF starts loading
      pdfContainer.innerHTML = '';
      
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
      
      // Get container width to calculate appropriate scale
      const containerWidth = pdfContainer.clientWidth - 40; // Subtract padding
      let searchFound = false;
      let pageWrappers = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Calculate scale based on container width
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.marginBottom = "20px";
        wrapper.style.width = "100%";
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.dataset.pageNumber = pageNum; // Store page number in dataset
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.style.maxWidth = "100%";
        wrapper.appendChild(canvas);
        pdfContainer.appendChild(wrapper);
        pageWrappers.push(wrapper); // Store wrapper for later reference

        const context = canvas.getContext("2d");
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

        // Get text content and search
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => item.str).join(" ");
        
        if (searchText && textItems.toLowerCase().includes(searchText.toLowerCase()) && !searchFound) {
          searchFound = true;
          
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

          // Scroll to the found page
          setTimeout(() => {
            wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 500);
        }

        // Always add page number
        const pageNumLabel = document.createElement("div");
        pageNumLabel.style.textAlign = "center";
        pageNumLabel.style.marginTop = "5px";
        pageNumLabel.innerHTML = `Page ${pageNum}`;
        wrapper.appendChild(pageNumLabel);
      }

      if (!searchFound && searchText) {
        // Check if this is the operational resilience PDF (secondary container)
        if (containerId === "secondary-pdf-container") {
          console.log("Search text not found in operational resilience PDF, scrolling to page 9");
          
          // Find page 9 wrapper (or the last page if less than 9 pages)
          const targetPage = Math.min(9, pdf.numPages);
          const targetWrapper = pageWrappers[targetPage - 1]; // Arrays are 0-indexed
          
          if (targetWrapper) {
            // Add a subtle indicator
            const pageIndicator = document.createElement("div");
            pageIndicator.style.position = "absolute";
            pageIndicator.style.top = "10px";
            pageIndicator.style.right = "10px";
            pageIndicator.style.background = "#e3f2fd";
            pageIndicator.style.padding = "5px 10px";
            pageIndicator.style.borderRadius = "4px";
            pageIndicator.style.border = "1px solid #bbdefb";
            pageIndicator.innerHTML = `Default Page`;
            targetWrapper.appendChild(pageIndicator);
            
            // Scroll to page 9
            setTimeout(() => {
              targetWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 500);
          }
        } else {
          // For other PDFs, show the not found message
          const notFoundMsg = document.createElement("div");
          notFoundMsg.style.padding = "20px";
          notFoundMsg.style.color = "red";
          notFoundMsg.innerHTML = `Search text "${searchText}" not found in document`;
          pdfContainer.insertBefore(notFoundMsg, pdfContainer.firstChild);
        }
      }
      
      return Promise.resolve();

    } catch (error) {
      console.error('Error loading PDF:', error);
      pdfContainer.innerHTML = `
        <div style="color: red; padding: 20px;">
          <p>Error loading PDF document</p>
          <p>Details: ${error.message}</p>
          <p>Path: ${pdfPath}</p>
        </div>
      `;
      return Promise.reject(error);
    }
  };

  const getComplianceChipColor = (status) => {
    switch (status) {
      case 'Compliant':
        return 'success';
      case 'Non-Compliant':
        return 'error';
      case 'Partial Compliance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleDomainChange = (domain) => (event, isExpanded) => {
    setExpandedDomain(isExpanded ? domain : '');
  };

  // Open the dialog with the selected test case details
  const handleOpenDetails = (testCaseData, domainKey, regulatorKey, policyCode) => {
    setSelectedTestCase({
      ...testCaseData,
      domain: domainKey,
      regulator: regulatorKey,
      policy_code: policyCode
    });
  };

  // Close the dialog
  const handleCloseDetails = () => {
    setSelectedTestCase(null);
  };

  // Update the handleViewSource function to handle nested structure
  const handleViewSource = async (testCase) => {
    try {
      setLoadingSource(true);
      
      // Navigate through the nested structure to find the document path
      const domain = testCase.domain.toLowerCase();
      const regulator = testCase.regulator;
      const policyCode = testCase.policy_code;
      
      // Find the document path in the nested structure
      const documentPath = regulationMapping.policies[domain]
        ?.find(regulatorObj => Object.keys(regulatorObj)[0] === regulator) // Find regulator object
        ?.[regulator] // Access regulator's policies array
        ?.find(policy => policy.policy_code === policyCode) // Find matching policy
        ?.policy_document_path;

      if (!documentPath) {
        throw new Error('Source document path not found');
      }

      // Construct the full path to the PDF - ensure it starts with a slash
      const pdfPath = documentPath.startsWith('/') ? documentPath : `/${documentPath}`;
      
      // Use the newly copied PDF in the public directory
      const operationalResiliencePath = "/operational_resilience.pdf";
      
      // Search text for operational resilience PDF
      const operationalResilienceSearchText = "Excerpt Evidence From Policy";
      
      console.log('Loading PDFs:', { 
        pdfPath, 
        operationalResiliencePath,
        primarySearchText: testCase.Rule_Citation,
        secondarySearchText: operationalResilienceSearchText
      });
      
      setDialogState({
        open: true,
        pdfPath,
        secondaryPdfPath: operationalResiliencePath,
        searchText: testCase.Rule_Citation,
        secondarySearchText: operationalResilienceSearchText,
        title: `${testCase.policy_code} - Source Documents`
      });

      // Give the dialog time to open before loading the PDFs
      setTimeout(() => {
        try {
          // Load the primary PDF (Rule Citation)
          loadPDFWithSearch(pdfPath, testCase.Rule_Citation, "pdf-container");
          
          // Load the operational resilience PDF from the public directory
          // and search for "Excerpt Evidence From Policy"
          loadPDFWithSearch(operationalResiliencePath, operationalResilienceSearchText, "secondary-pdf-container");
        } catch (error) {
          console.error('Error in setTimeout when loading PDFs:', error);
        }
      }, 500); // Increased timeout to ensure dialog is fully rendered

    } catch (error) {
      console.error('Error loading source document:', error);
      // Show error message to user
      alert('Error loading source document. Please try again later.');
    } finally {
      setLoadingSource(false);
    }
  };

  const handlePreviewClose = () => {
    setDialogState(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress style={{ color: '#673ab7' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  // Safely access policy_validation
  const { policy_validation = {} } = data || {};
  
  // Filter domains based on selected version
  const filteredPolicyValidation = { ...policy_validation };
  
  // For version 1, remove customer_communications domain
  if (selectedVersion === 'v1' && filteredPolicyValidation.customer_communications) {
    delete filteredPolicyValidation.customer_communications;
  }
  
  // For version 2, remove sup15 policy code from operational_resilience domain
  if (selectedVersion === 'v2' && 
      filteredPolicyValidation.operational_resilience) {
    
    // Loop through each regulator in operational_resilience
    Object.keys(filteredPolicyValidation.operational_resilience).forEach(regulatorKey => {
      // Filter out policies with policy_code 'sup15'
      filteredPolicyValidation.operational_resilience[regulatorKey] = 
        filteredPolicyValidation.operational_resilience[regulatorKey].filter(
          policy => policy.policy_code !== 'sup15'
        );
    });
  }

  // =========================
  // DASHBOARD STATS LOGIC
  // =========================
  const stats = {
    regulators: new Set(),
    policyCodes: new Set(),
    totalPolicyCount: 0,
    complianceCounts: {
      Compliant: 0,
      'Partial Compliance': 0,
      'Non-Compliant': 0
    },
    domainCompliance: {},
    totalTestCases: 0
  };

  // Aggregate stats - use filteredPolicyValidation instead of policy_validation
  Object.entries(filteredPolicyValidation).forEach(([domainKey, domainValue]) => {
    // Initialize domain compliance
    stats.domainCompliance[domainKey] = {
      Compliant: 0,
      'Partial Compliance': 0,
      'Non-Compliant': 0,
      total: 0
    };

    Object.entries(domainValue).forEach(([regulatorKey, policyArray]) => {
      stats.regulators.add(regulatorKey);

      policyArray.forEach((policyItem) => {
        stats.policyCodes.add(policyItem.policy_code);
        stats.totalPolicyCount += 1;

        policyItem.policy_validations.forEach((testCase) => {
          stats.totalTestCases += 1;
          const status = testCase.Compliance_Status || '';
          if (status in stats.complianceCounts) {
            stats.complianceCounts[status] += 1;
            stats.domainCompliance[domainKey][status] += 1;
            stats.domainCompliance[domainKey].total += 1;
          }
        });
      });
    });
  });

  // Convert sets to actual numbers
  const totalRegulators = stats.regulators.size;
  const totalPolicies = selectedVersion === 'v2' ? stats.totalPolicyCount : stats.policyCodes.size;
  const { Compliant, 'Partial Compliance': Partial, 'Non-Compliant': Non } =
    stats.complianceCounts;

  // Add this after the stats aggregation
  const prepareRegulatoryData = () => {
    const regulatorCounts = {};
    Object.values(filteredPolicyValidation).forEach(domainValue => {
      Object.entries(domainValue).forEach(([regulator, policies]) => {
        if (!regulatorCounts[regulator]) {
          regulatorCounts[regulator] = 0;
        }
        policies.forEach(policy => {
          regulatorCounts[regulator] += policy.policy_validations.length;
        });
      });
    });

    return Object.entries(regulatorCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Helper function to get display name for compliance status
  const getComplianceDisplayName = (status) => {
    if (status === 'Partial Compliance') return 'Needs review';
    return status;
  };

  // Add these color constants
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Replace the Rule Interpretations card with this new version
  const RuleInterpretationsCard = () => (
    <Card elevation={3} sx={{ height: '100%', backgroundColor: '#f5f5f5' }}>
      <CardContent>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Distribution By Regulator
        </Typography>
        <Box style={{ height: 250, position: 'relative', display: 'flex' }}>
          <Box style={{ flex: '1', position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepareRegulatoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ value }) => value > 0 ? `${value}` : ''}
                >
                  {prepareRegulatoryData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box style={{ 
            width: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            paddingLeft: '16px'
          }}>
            {prepareRegulatoryData().map((item, index) => (
              <Box 
                key={item.name} 
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
                    backgroundColor: COLORS[index % COLORS.length],
                    borderRadius: '2px'
                  }}
                />
                {item.name}
              </Box>
            ))}
          </Box>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center" 
          sx={{ mt: 1 }}
        >
          Total: {stats.totalTestCases}
        </Typography>
      </CardContent>
    </Card>
  );

  const ComplianceCard = () => {
    // Calculate percentages
    const compliantPercent = Math.round((stats.complianceCounts.Compliant / stats.totalTestCases) * 100);
    const needsReviewPercent = Math.round((stats.complianceCounts['Partial Compliance'] / stats.totalTestCases) * 100);
    const nonCompliantPercent = Math.round((stats.complianceCounts['Non-Compliant'] / stats.totalTestCases) * 100);
    
    return (
      <Card elevation={3} sx={{ height: '100%', backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Overall Compliance
          </Typography>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="body1">
              Compliant
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={40}
                  thickness={4}
                  sx={{ color: '#e0e0e0' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={compliantPercent}
                  size={40}
                  thickness={4}
                  sx={{ 
                    color: 'success.main',
                    position: 'absolute',
                    left: 0,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    {compliantPercent}%
                  </Typography>
                </Box>
              </Box>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Typography variant="body1">
              Needs review
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={40}
                  thickness={4}
                  sx={{ color: '#e0e0e0' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={needsReviewPercent}
                  size={40}
                  thickness={4}
                  sx={{ 
                    color: 'warning.main',
                    position: 'absolute',
                    left: 0,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    {needsReviewPercent}%
                  </Typography>
                </Box>
              </Box>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              Non-Compliant
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={40}
                  thickness={4}
                  sx={{ color: '#e0e0e0' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={nonCompliantPercent}
                  size={40}
                  thickness={4}
                  sx={{ 
                    color: 'error.main',
                    position: 'absolute',
                    left: 0,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    {nonCompliantPercent}%
                  </Typography>
                </Box>
              </Box>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="content-area">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '2.2rem' }}>Policy Assessment</h1>
        {showV2Interpretation && (
          <FormControl variant="outlined" size="small" style={{ minWidth: 150, marginRight: '20px' }}>
            <InputLabel id="version-select-label">Older Versions</InputLabel>
            <Select
              labelId="version-select-label"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              label="Older Versions"
            >
              <MenuItem value="v2">Version 2 (Latest)</MenuItem>
              <MenuItem value="v1">Version 1</MenuItem>
            </Select>
          </FormControl>
        )}
      </div>
      
      {/* Version information banner */}
      <Box 
        sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 1,
          backgroundColor: selectedVersion === 'v1' ? '#FDF2F8' : '#F0F7FF',
          borderLeft: selectedVersion === 'v1' ? '4px solid #ec4899' : '4px solid #3b82f6'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
          {selectedVersion === 'v1' ? 'Version 1' : 'Version 2'} - Policy Assessment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Policy Assessment done using {selectedVersion} rule interpretations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Released: {new Date(versionsData.find(v => v.version === selectedVersion).date).toLocaleDateString()}
        </Typography>
      </Box>

      {/* DASHBOARD SECTION */}
      <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
        <Grid container spacing={3}>
          {/* Stats Column */}
          <Grid item xs={12} md={3}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Regulators Card */}
              <Card className="stat-card" sx={{ height: '120px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Total Regulators</Typography>
                  <Typography variant="h4" style={{ color: '#673ab7', marginTop: '4px' }}>{totalRegulators}</Typography>
                </CardContent>
              </Card>

              {/* Policies Card */}
              <Card className="stat-card" sx={{ height: '120px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">Total Policies</Typography>
                  <Typography variant="h4" style={{ color: '#673ab7', marginTop: '4px' }}>{totalPolicies}</Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={5}>
            <RuleInterpretationsCard />
          </Grid>

          {/* Overall Compliance */}
          <Grid item xs={12} md={4}>
            <ComplianceCard />
          </Grid>

          {/* Domain-wise Compliance Breakdown */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'left' }}>
                  Domain-wise Compliance Breakdown
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(stats.domainCompliance).map(([domain, counts]) => {
                    // Calculate percentages
                    const compliantPercent = Math.round((counts.Compliant / counts.total) * 100);
                    const needsReviewPercent = Math.round((counts['Partial Compliance'] / counts.total) * 100);
                    const nonCompliantPercent = Math.round((counts['Non-Compliant'] / counts.total) * 100);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={domain}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {domain.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Typography variant="body2">Compliant:</Typography>
                                <Typography variant="body2" color="success.main">
                                  {compliantPercent}%
                                </Typography>
                              </div>
                              <Box sx={{ width: '100%', bgcolor: '#e0e0e0', height: '6px', borderRadius: '3px' }}>
                                <Box
                                  sx={{
                                    width: `${compliantPercent}%`,
                                    bgcolor: 'success.main',
                                    height: '6px',
                                    borderRadius: '3px'
                                  }}
                                />
                              </Box>
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Typography variant="body2">Needs review:</Typography>
                                <Typography variant="body2" color="warning.main">
                                  {needsReviewPercent}%
                                </Typography>
                              </div>
                              <Box sx={{ width: '100%', bgcolor: '#e0e0e0', height: '6px', borderRadius: '3px' }}>
                                <Box
                                  sx={{
                                    width: `${needsReviewPercent}%`,
                                    bgcolor: 'warning.main',
                                    height: '6px',
                                    borderRadius: '3px'
                                  }}
                                />
                              </Box>
                            </div>
                            
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Typography variant="body2">Non-Compliant:</Typography>
                                <Typography variant="body2" color="error.main">
                                  {nonCompliantPercent}%
                                </Typography>
                              </div>
                              <Box sx={{ width: '100%', bgcolor: '#e0e0e0', height: '6px', borderRadius: '3px' }}>
                                <Box
                                  sx={{
                                    width: `${nonCompliantPercent}%`,
                                    bgcolor: 'error.main',
                                    height: '6px',
                                    borderRadius: '3px'
                                  }}
                                />
                              </Box>
                            </div>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
      {/* END DASHBOARD */}

      <div className="policy-assessment-container">
        {Object.entries(filteredPolicyValidation).map(([domainKey, domainValue]) => (
          <Accordion
            key={domainKey}
            expanded={expandedDomain === domainKey}
            onChange={handleDomainChange(domainKey)}
            className="domain-accordion"
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className="domain-summary"
            >
              <Typography variant="h6" className="domain-title">
                {domainKey.replace(/_/g, ' ').toUpperCase()}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <TableContainer component={Paper} className="table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell className="header-cell">Regulator</TableCell>
                      <TableCell className="header-cell">Policy Code</TableCell>
                      <TableCell className="header-cell">Rule Interpretation #</TableCell>
                      <TableCell className="header-cell">
                        Rule Description
                      </TableCell>
                      <TableCell className="header-cell">
                        Regulation Interpretation
                      </TableCell>
                      <TableCell className="header-cell">
                        Compliance Status
                      </TableCell>
                      <TableCell className="header-cell">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(domainValue).map(([regulatorKey, policyArray]) =>
                      policyArray.map((policyItem, pIdx) =>
                        policyItem.policy_validations.map((testCase, tIdx) => (
                          <TableRow
                            key={`${regulatorKey}-${policyItem.policy_code}-${tIdx}`}
                            hover
                            className="mapping-row"
                          >
                            <TableCell>
                              <Chip
                                label={regulatorKey}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={policyItem.policy_code}
                                className="policy-chip"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {testCase.Test_case_no}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {testCase.Regulation_Description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {testCase.Interpreted_Rule}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getComplianceDisplayName(testCase.Compliance_Status)}
                                color={getComplianceChipColor(
                                  testCase.Compliance_Status
                                )}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleOpenDetails(
                                  testCase,
                                  domainKey,
                                  regulatorKey,
                                  policyItem.policy_code
                                )}
                              >
                                View
                              </Button>
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
        ))}
      </div>

      {/* Dialog for Reason / Excerpt / Recommendation */}
      <Dialog
        open={!!selectedTestCase}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Additional Details</DialogTitle>
        <DialogContent dividers>
          {selectedTestCase && (
            <>
              <Typography variant="h6" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedTestCase.Reason}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Excerpt Evidence From Policy:
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedTestCase.Excerpt_Evidence_From_Policy}
              </Typography>

              {selectedTestCase.Remediation_Recommendation && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Remediation Recommendation:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTestCase.Remediation_Recommendation}
                  </Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleViewSource(selectedTestCase)}
            variant="outlined"
            color="primary"
            disabled={loadingSource}
            startIcon={loadingSource ? <CircularProgress size={20} /> : null}
          >
            View Source
          </Button>
          <Button onClick={handleCloseDetails} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add the Source Document Dialog */}
      <Dialog
        open={showSourceDialog}
        onClose={() => setShowSourceDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            height: '80vh',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          Source Document
          {selectedTestCase && (
            <Typography variant="subtitle2" color="text.secondary">
              Policy Code: {selectedTestCase.policy_code}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {sourceDocument ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                height: '100%',
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                '& pre': {
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }
              }}
            >
              <pre>{sourceDocument}</pre>
            </Paper>
          ) : (
            <Typography color="text.secondary" align="center">
              No source document available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSourceDialog(false)} 
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogState.open}
        onClose={handlePreviewClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { 
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          {dialogState.title}
        </DialogTitle>
        <DialogContent sx={{ padding: 2, overflow: 'hidden' }}>
          {/* Side by side view */}
          <Box sx={{ 
            display: 'flex', 
            height: 'calc(100% - 16px)', 
            gap: 2,
            '& > div': {
              flex: 1,
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }
          }}>
            <Box>
              <Typography variant="subtitle2" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                Rule Citation Document
              </Typography>
              <div 
                id="pdf-container" 
                style={{ 
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px'
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                Operational Resilience Framework
              </Typography>
              <div 
                id="secondary-pdf-container" 
                style={{ 
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px'
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PolicyAssessment;
