import ruleInterpretationV1 from '../data/regulation_interpretation/rule_interpretation_v1.json';
import ruleInterpretationV2 from '../data/regulation_interpretation/rule_interpretation_v2.json';
import regulationMappingData from '../data/regulation_mapping/regulation_mapping.json';
import policyAssessmentData from '../data/policy_assessment/policy_assessment_results.json';
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

var mock_policy_data = [{
    id: 1,
    lastRun: '04/03/2025',
    policyDetails: 'Operation Resilience Framework',
    evaluationComplaint: '51/79',
    evaluationPartiallyComplaint: '17/79',
    evaluationNonComplaint: '11/79'
  },
  {
    id: 2,
    lastRun: '04/03/2025',
    policyDetails: 'Customer Communications and Financial Promotions',
    evaluationComplaint: '53/163',
    evaluationPartiallyComplaint: '42/163',
    evaluationNonComplaint: '68/163'
  }]

const update_mock_data = () =>{
  const complianceCounts = {};
  var i = 0
  Object.values(policyAssessmentData.policy_validation).forEach(category => {
    var policy_counts = {"Compliant":0, "Partial Compliance":0, "Non-Compliant":0}
      Object.values(category).forEach(policyArray => {
          policyArray.forEach(policy => {
              policy.policy_validations.forEach(validation => {
                  const validationName = validation.Interpreted_Rule;
                  const status = validation.Compliance_Status;
                  
                  if (!complianceCounts[validationName]) {
                      complianceCounts[validationName] = {};
                  }
                  
                  if (!complianceCounts[validationName][status]) {
                      complianceCounts[validationName][status] = 0;
                  }
                  
                  complianceCounts[validationName][status] += 1;
                  policy_counts[status] += complianceCounts[validationName][status]
              });
              //console.log(policy,policy_counts["Compliant"])
          });
      });
      var total_cases = policy_counts['Compliant']+policy_counts['Partial Compliance']+policy_counts['Non-Compliant']
      mock_policy_data[i].evaluationComplaint = String(policy_counts['Compliant'])+"/"+String(total_cases)
      mock_policy_data[i].evaluationPartiallyComplaint = String(policy_counts['Partial Compliance'])+"/"+String(total_cases)
      mock_policy_data[i].evaluationNonComplaint = String(policy_counts['Non-Compliant'])+"/"+String(total_cases)
      i += 1
      //console.log(mock_policy_data)
  });
}

const mockApiCall = (data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

export const api = {
  // Policy Evaluation endpoints
  getHome: () => {
    // Check if we're in development mode or API URL is not set
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      update_mock_data();
      return mockApiCall(mock_policy_data);
    }
    return fetch(`${BASE_URL}/policy-evaluations`).then(handleResponse);
  },

  // Rule Mapping endpoints
  getRuleMappings: () => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      return mockApiCall(regulationMappingData);
    }
    return fetch(`${BASE_URL}/rule-mappings`).then(handleResponse);
  },

  // Rule Interpretation endpoints
  getRuleInterpretations: () => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      // Return an object with all versions
      const interpretations = {
        versions: [
          {
            version: "v1",
            date: "2025-03-04",
            data: ruleInterpretationV1
          },
          {
            version: "v2",
            date: "2025-03-05",
            data: ruleInterpretationV2
          }
        ],
        latest: ruleInterpretationV2
      };
      return mockApiCall(interpretations);
    }
    return fetch(`${BASE_URL}/rule-interpretations`).then(handleResponse);
  },

  getRuleInterpretationByVersion: (version) => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      const interpretationData = version === 'v1' ? ruleInterpretationV1 : ruleInterpretationV2;
      return mockApiCall(interpretationData);
    }
    return fetch(`${BASE_URL}/rule-interpretations/${version}`).then(handleResponse);
  },

  // Policy Assessment endpoints
  getPolicyAssessment: () => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      return mockApiCall(policyAssessmentData);
    }
    return fetch(`${BASE_URL}/policy-assessment`).then(handleResponse);
  },

  updateRuleMapping: async (mappingId, changes) => {
    // Implement the API call to update the mapping
  },

  createRuleMapping: async (newMapping) => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      // Mock API call
      return mockApiCall({ success: true, data: newMapping });
    }
    return fetch(`${BASE_URL}/rule-mappings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMapping)
    }).then(handleResponse);
  },

  runRuleInterpretation: async () => {
    if (!process.env.REACT_APP_API_URL || process.env.NODE_ENV === 'development') {
      // Mock API call with delay to simulate processing
      return mockApiCall({ success: true, message: 'Rule interpretation completed' }, 60000);
    }
    return fetch(`${BASE_URL}/rule-interpretation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(handleResponse);
  }
}; 