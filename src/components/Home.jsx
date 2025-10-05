import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Tooltip as MuiTooltip, CircularProgress, Grid, Card, CardContent 
} from '@mui/material';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAppContext } from '../context/AppContext';
import './Home.css';
import RuleInterpretation from './RuleInterpretation';
import RuleMapping from './RuleMapping';
import PolicyAssessment from './PolicyAssessment';

const COLORS = ['#4CAF50', '#FFA726', '#EF5350'];

const EvaluationPieChart = ({ compliant, nonCompliant, partiallyCompliant }) => {
  // Parse the input values correctly
  const [compliantNum, compliantTotal] = compliant.split('/').map(Number);
  const [nonCompliantNum, nonCompliantTotal] = nonCompliant.split('/').map(Number);
  const [partiallyCompliantNum, partiallyCompliantTotal] = partiallyCompliant.split('/').map(Number);
  
  const total = compliantTotal; // All should have the same total
  
  const compliantPercentage = Math.round((compliantNum / total) * 100) || 0;
  const partiallyCompliantPercentage = Math.round((partiallyCompliantNum / total) * 100) || 0;
  const nonCompliantPercentage = Math.round((nonCompliantNum / total) * 100) || 0;
  
  const COLORS = ['#4CAF50', '#FFA726', '#EF5350'];
  
  const data = [
    { name: 'Compliant', value: compliantNum, totalValue: total },
    { name: 'Needs Review', value: partiallyCompliantNum, totalValue: total },
    { name: 'Non-Compliant', value: nonCompliantNum, totalValue: total }
  ];
  
  return (
    <Box className="evaluation-chart">
      <div className="chart-container">
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
        <div className="chart-legend">
          <Typography variant="body2" className="evaluation-text compliant">
            {compliant} Compliant ({compliantPercentage}%)
          </Typography>
          <Typography variant="body2" className="evaluation-text partially-compliant">
            {partiallyCompliant} Need Review ({partiallyCompliantPercentage}%)
          </Typography>
          <Typography variant="body2" className="evaluation-text non-compliant">
            {nonCompliant} Non-Compliant ({nonCompliantPercentage}%)
          </Typography>
        </div>
      </div>
    </Box>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = Math.round((data.value / data.totalValue) * 100);
    
    return (
      <div className="custom-tooltip">
        <div className="label">{data.name}</div>
        <div className="value">{data.value}</div>
        <div className="percentage">{percentage}%</div>
      </div>
    );
  }
  
  return null;
};

const DashboardDonutChart = ({ data, title, centerText }) => {
  const COLORS = ['#4CAF50', '#FFA726', '#EF5350'];
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate angles for each segment to match the design
  const compliantValue = data.find(item => item.name === 'Compliant')?.value || 0;
  const needsReviewValue = data.find(item => item.name === 'Needs Review')?.value || 0;
  const nonCompliantValue = data.find(item => item.name === 'Non-Compliant')?.value || 0;
  
  // Calculate percentages for the legend
  const compliantPercentage = Math.round((compliantValue / totalValue) * 100) || 0;
  const needsReviewPercentage = Math.round((needsReviewValue / totalValue) * 100) || 0;
  const nonCompliantPercentage = Math.round((nonCompliantValue / totalValue) * 100) || 0;
  
  // Add totalValue to each data item for tooltip percentage calculation
  const enhancedData = data.map(item => ({
    ...item,
    totalValue
  }));
  
  return (
    <div className="dashboard-donut-chart">
      <Typography variant="h6" className="chart-title">{title}</Typography>
      <div className="donut-chart-container">
        <div className="donut-chart-wrapper">
          <PieChart width={200} height={200}>
            <Pie
              data={enhancedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {enhancedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
          <div className="donut-center-text">
            <Typography variant="h4" className="center-value">{centerText}</Typography>
          </div>
        </div>
        <div className="donut-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#EF5350' }}></span>
            <span className="legend-label">Non Compliant: {nonCompliantValue}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FFA726' }}></span>
            <span className="legend-label">Needs Review: {needsReviewValue}</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
            <span className="legend-label">Compliant: {compliantValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div className="stat-card">
      <Typography variant="subtitle1" className="stat-title">{title}</Typography>
      <Typography variant="h3" className="stat-value">{value}</Typography>
    </div>
  );
};

const ComplianceBarChart = ({ data, title }) => {
  const COLORS = ['#4CAF50', '#FFA726', '#EF5350'];
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages for each category
  const enhancedData = data.map(item => ({
    ...item,
    percentage: Math.round((item.value / totalValue) * 100) || 0
  }));
  
  // Find the maximum value for dynamic X-axis domain
  const maxValue = Math.max(...data.map(item => item.value), 1);
  // Round up to the nearest 10 or 50 depending on the size
  const roundedMax = maxValue <= 50 
    ? Math.ceil(maxValue / 10) * 10 
    : Math.ceil(maxValue / 50) * 50;
  
  return (
    <div className="compliance-bar-chart">
      <Typography variant="h6" className="chart-title">{title}</Typography>
      <div className="bar-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={enhancedData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, roundedMax]} 
              tickCount={6}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#E0E0E0' }}
              tickLine={{ stroke: '#E0E0E0' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ 
                fontSize: 14,
                fontWeight: 600,
                fill: '#666'
              }}
              axisLine={false}
            />
            <RechartsTooltip
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="label">{data.name}</div>
                      <div className="value">{data.value} test cases</div>
                      <div className="percentage">{data.percentage}% of total</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              barSize={40}
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            >
              {enhancedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                style={{ fill: '#333', fontSize: '13px', fontWeight: 500 }}
                formatter={(value, entry) => {
                  const item = enhancedData.find(item => item.value === value);
                  return `${value} (${item.percentage}%)`;
                }}
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Home = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  
  // Fetch both home data and policy assessment data
  const { 
    data: policyData, 
    loading: homeLoading, 
    error: homeError 
  } = useApi(api.getHome);

  const {
    data: assessmentData,
    loading: assessmentLoading,
    error: assessmentError
  } = useApi(api.getPolicyAssessment);

  const { showV2Interpretation } = useAppContext();

  const menuItems = [
    { 
      icon: <DashboardIcon />, 
      label: 'Home', 
      id: 'home',
      active: activeMenu === 'home' 
    },
    { 
      icon: <AssignmentIcon />, 
      label: 'Rule Mapping', 
      id: 'rule-mapping',
      active: activeMenu === 'rule-mapping' 
    },
    { 
      icon: <AssessmentIcon />, 
      label: 'Rule Interpretation', 
      id: 'rule-interpretation',
      active: activeMenu === 'rule-interpretation' 
    },
    { 
      icon: <DescriptionIcon />, 
      label: 'Policy Assessment', 
      id: 'policy-assessment',
      active: activeMenu === 'policy-assessment' 
    }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
  };

  // Process assessment data to create home page data
  const processAssessmentData = () => {
    if (!assessmentData || !assessmentData.policy_validation) {
      return {
        homeTableData: policyData || [],
        complianceChartData: []
      };
    }

    // Define assessment runs with their domains based on showV2Interpretation flag
    const assessmentRuns = showV2Interpretation 
      ? [
          {
            date: '2025-03-04',
            domains: ['operational_resilience'],
            overrideTotalPolicies: 78 // Override for 04-03 date to show 78 policies
          },
          {
            date: '2025-03-07',
            domains: ['operational_resilience', 'customer_communications']
          }
        ]
      : [
          {
            date: '2025-03-04',
            domains: ['operational_resilience'],
            overrideTotalPolicies: 78 // Override for 04-03 date to show 78 policies
          }
        ];

    // Create table data for each domain in each assessment run
    const homeTableData = [];
    
    // Track unique policies and test cases
    const uniquePolicies = new Set();
    
    // Track unique test cases and their compliance status
    const uniqueTestCases = new Map(); // Map of test case ID to compliance status
    
    assessmentRuns.forEach(run => {
      run.domains.forEach(domainKey => {
        const domainData = assessmentData.policy_validation[domainKey];
        
        if (!domainData) return;
        
        let compliant = 0;
        let partialCompliance = 0;
        let nonCompliant = 0;
        let total = 0;
        
        // Count compliance statuses for this domain
        Object.entries(domainData).forEach(([regulatorKey, policyArray]) => {
          // For version 2 operational_resilience, filter out sup15 policy code
          const filteredPolicyArray = run.date === '2025-03-07' && domainKey === 'operational_resilience'
            ? policyArray.filter(policy => policy.policy_code !== 'sup15')
            : policyArray;
          
          filteredPolicyArray.forEach(policy => {
            // Add policy to unique policies set
            uniquePolicies.add(`${domainKey}-${regulatorKey}-${policy.policy_code}`);
            
            policy.policy_validations.forEach(validation => {
              // Create a unique test case ID
              const testCaseId = `${domainKey}-${regulatorKey}-${policy.policy_code}-${validation.Test_case_no}`;
              
              // Store the test case with its compliance status
              uniqueTestCases.set(testCaseId, validation.Compliance_Status);
              
              total++;
              if (validation.Compliance_Status === 'Compliant') {
                compliant++;
              } else if (validation.Compliance_Status === 'Partial Compliance') {
                partialCompliance++;
              } else if (validation.Compliance_Status === 'Non-Compliant') {
                nonCompliant++;
              }
            });
          });
        });
        
        // Format domain name for display
        const formattedDomain = domainKey
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Apply override for 04-03 date if specified
        if (run.date === '2025-03-04' && run.overrideTotalPolicies) {
          // Calculate the ratio to maintain the same proportions
          const ratio = run.overrideTotalPolicies / total;
          const adjustedCompliant = Math.round(compliant * ratio);
          const adjustedPartial = Math.round(partialCompliance * ratio);
          const adjustedNonCompliant = Math.round(nonCompliant * ratio);
          
          // Ensure the total adds up to the override value by adjusting the largest category
          const adjustedTotal = adjustedCompliant + adjustedPartial + adjustedNonCompliant;
          let finalCompliant = adjustedCompliant;
          let finalPartial = adjustedPartial;
          let finalNonCompliant = adjustedNonCompliant;
          
          if (adjustedTotal !== run.overrideTotalPolicies) {
            const diff = run.overrideTotalPolicies - adjustedTotal;
            // Add the difference to the largest category
            if (adjustedCompliant >= adjustedPartial && adjustedCompliant >= adjustedNonCompliant) {
              finalCompliant += diff;
            } else if (adjustedPartial >= adjustedCompliant && adjustedPartial >= adjustedNonCompliant) {
              finalPartial += diff;
            } else {
              finalNonCompliant += diff;
            }
          }
          
          homeTableData.push({
            id: `${run.date}-${domainKey}`,
            lastRun: run.date,
            policyDetails: formattedDomain,
            evaluationComplaint: `${finalCompliant}/${run.overrideTotalPolicies}`,
            evaluationPartiallyComplaint: `${finalPartial}/${run.overrideTotalPolicies}`,
            evaluationNonComplaint: `${finalNonCompliant}/${run.overrideTotalPolicies}`
          });
        } else {
          homeTableData.push({
            id: `${run.date}-${domainKey}`,
            lastRun: run.date,
            policyDetails: formattedDomain,
            evaluationComplaint: `${compliant}/${total}`,
            evaluationPartiallyComplaint: `${partialCompliance}/${total}`,
            evaluationNonComplaint: `${nonCompliant}/${total}`
          });
        }
      });
    });
    
    // Count unique test cases by compliance status
    let uniqueCompliant = 0;
    let uniquePartial = 0;
    let uniqueNonCompliant = 0;
    
    uniqueTestCases.forEach(status => {
      if (status === 'Compliant') {
        uniqueCompliant++;
      } else if (status === 'Partial Compliance') {
        uniquePartial++;
      } else if (status === 'Non-Compliant') {
        uniqueNonCompliant++;
      }
    });
    
    // Adjust the compliance chart data for the home page if we're showing version 1
    if (!showV2Interpretation) {
      // Calculate the ratio to maintain the same proportions for 78 policies
      const totalTestCases = uniqueCompliant + uniquePartial + uniqueNonCompliant;
      const ratio = 78 / totalTestCases;
      
      uniqueCompliant = Math.round(uniqueCompliant * ratio);
      uniquePartial = Math.round(uniquePartial * ratio);
      uniqueNonCompliant = Math.round(uniqueNonCompliant * ratio);
      
      // Ensure the total adds up to 78 by adjusting the largest category
      const adjustedTotal = uniqueCompliant + uniquePartial + uniqueNonCompliant;
      if (adjustedTotal !== 78) {
        const diff = 78 - adjustedTotal;
        // Add the difference to the largest category
        if (uniqueCompliant >= uniquePartial && uniqueCompliant >= uniqueNonCompliant) {
          uniqueCompliant += diff;
        } else if (uniquePartial >= uniqueCompliant && uniquePartial >= uniqueNonCompliant) {
          uniquePartial += diff;
        } else {
          uniqueNonCompliant += diff;
        }
      }
    }
    
    const complianceChartData = [
      { name: 'Compliant', value: uniqueCompliant },
      { name: 'Needs Review', value: uniquePartial },
      { name: 'Non-Compliant', value: uniqueNonCompliant }
    ];
    
    return {
      homeTableData: homeTableData.length > 0 ? homeTableData : policyData || [],
      complianceChartData,
      totalPolicies: !showV2Interpretation ? 6 : uniquePolicies.size,
      totalRules: !showV2Interpretation ? 78 : uniqueTestCases.size
    };
  };

  const { homeTableData, complianceChartData, totalPolicies, totalRules } = processAssessmentData();
  
  const loading = homeLoading || assessmentLoading;
  const error = homeError || assessmentError;

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        
        <h1>Regulatory Compliance Dashboard</h1>
        <div style={{ width: '40px' }}></div>
      </div>
      <div className="main-content">
        <div className="side-menu">
          <ul>
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={item.active ? 'active' : ''}
                onClick={() => handleMenuClick(item.id)}
              >
                <MuiTooltip 
                  title={item.label} 
                  placement="right"
                  arrow
                >
                  <div>{item.icon}</div>
                </MuiTooltip>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="content-area">
          {activeMenu === 'home' ? (
            <>
              <div className="header">
                <h1 className="dashboard-title" style={{ fontWeight: 'bold', fontSize: '2.2rem' }}>Home Dashboard</h1>
                <div className="header-actions">
                  <div className="notification-icon">
                    <NotificationsIcon />
                    <span className="notification-badge">2</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <CircularProgress style={{ color: '#673ab7' }} />
                </div>
              ) : (
                <>
                  <div className="dashboard-container">
                    <div className="dashboard-row">
                      <div className="dashboard-chart-section">
                        <DashboardDonutChart
                          data={complianceChartData}
                          title="Overall Compliance Distribution"
                        />
                      </div>
                      <div className="dashboard-stats-section">
                        <div className="stats-header">
                          <h2>Summary Statistics</h2>
                        </div>
                        <div className="stats-cards">
                          <StatCard 
                            title="Total Policies Assessed" 
                            value={totalPolicies || 0} 
                          />
                          <StatCard 
                            title="Total Rules Evaluated" 
                            value={totalRules || 0} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="policy-table-container">
                    <table className="policy-table">
                      <thead>
                        <tr>
                          <th className="date-column">Last Run</th>
                          <th className="details-column">Policy Details</th>
                          <th className="status-column">Evaluation Status</th>
                          <th className="review-column">Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeTableData.map((policy, index) => {
                          return (
                            <tr key={policy.id || index}>
                              <td>{policy.lastRun}</td>
                              <td>{policy.policyDetails}</td>
                              <td>
                                <EvaluationPieChart 
                                  compliant={policy.evaluationComplaint}
                                  nonCompliant={policy.evaluationNonComplaint}
                                  partiallyCompliant={policy.evaluationPartiallyComplaint}
                                />
                              </td>
                              <td>
                                <button 
                                  className="review-button" 
                                  onClick={() => handleMenuClick('policy-assessment')}
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : activeMenu === 'rule-interpretation' ? (
            <RuleInterpretation />
          ) : activeMenu === 'rule-mapping' ? (
            <RuleMapping />
          ) : activeMenu === 'policy-assessment' ? (
            <PolicyAssessment />
          ) : (
            <div>Coming Soon</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 