import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

// Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title
);

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [dashboardData, setDashboardData] = useState([
    { title: 'By Department', data: [] },
    { title: 'By Form Type', data: [] }
  ]);
  const [selectedFormType, setSelectedFormType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [formTypes, setFormTypes] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalForms: 0,
    totalValueApproved: 0,
    totalValuePending: 0,
    formsByStatus: {}
  });
  const [timelineData, setTimelineData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculateSummaryData = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        totalForms: 0,
        totalValueApproved: 0,
        totalValuePending: 0,
        formsByStatus: {}
      };
    }

    const summary = {
      totalForms: data.length,
      totalValueApproved: 0,
      totalValuePending: 0,
      formsByStatus: {}
    };

    data.forEach(form => {
      if (form.status) {
        if (!summary.formsByStatus[form.status]) {
          summary.formsByStatus[form.status] = 0;
        }
        summary.formsByStatus[form.status]++;

        try {
          const details = parseFormDetails(form);
          let value = 0;

          if (form.form_name === 'Purchase Request') {
            if (details.grandTotal !== undefined) {
              value = parseFloat(details.grandTotal) || 0;
            } else if (details.subTotal !== undefined && details.vat !== undefined) {
              const subTotal = parseFloat(details.subTotal) || 0;
              const vat = parseFloat(details.vat) || 0;
              value = subTotal + vat;
            } else if (details.items && Array.isArray(details.items)) {
              value = details.items.reduce((sum, item) => {
                return sum + (parseFloat(item.amount) || 0);
              }, 0);
            }
          } else if (form.form_name === 'Major Capital Authorization Request') {
            let additionTotal = 0;
            let disposalTotal = 0;
            
            if (details.totalAdditionRequest !== undefined) {
              additionTotal = parseFloat(details.totalAdditionRequest) || 0;
            } else if (details.additionItems && Array.isArray(details.additionItems)) {
              additionTotal = details.additionItems.reduce((sum, item) => {
                return sum + (parseFloat(item.amount) || 0);
              }, 0);
            }
            
            if (details.totalDisposalRequest !== undefined) {
              disposalTotal = parseFloat(details.totalDisposalRequest) || 0;
            } else if (details.disposalItems && Array.isArray(details.disposalItems)) {
              disposalTotal = details.disposalItems.reduce((sum, item) => {
                return sum + (parseFloat(item.amount) || 0);
              }, 0);
            }
            
            value = additionTotal + disposalTotal;
          } else if (form.form_name === 'Minor Capital Authorization Request') {
            if (details.totals && details.totals.total !== undefined) {
              value = parseFloat(details.totals.total) || 0;
            } else if (details.totalAmount !== undefined) {
              value = parseFloat(details.totalAmount) || 0;
            } else if (details.items && Array.isArray(details.items)) {
              value = details.items.reduce((sum, item) => {
                return sum + (parseFloat(item.total) || 0);
              }, 0);
            }
          }

          if (form.status === 'Approved' || form.status === 'Approve') {
            summary.totalValueApproved += value;
          } else if (form.status === 'Waiting For Approve') {
            summary.totalValuePending += value;
          }
        } catch (err) {
          console.warn('Error calculating value for form:', err.message);
        }
      }
    });

    return summary;
  }, []);

  const memoizedSummaryData = useMemo(() => {
    return calculateSummaryData(filteredForms);
  }, [filteredForms, calculateSummaryData]);

  useEffect(() => {
    setSummaryData(memoizedSummaryData);
  }, [memoizedSummaryData]);

  const processChartData = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [
        { title: 'By Department', data: [] },
        { title: 'By Form Type', data: [] }
      ];
    }

    const deptMap = {};
    const formTypeMap = {};

    data.forEach(form => {
      try {
        const details = parseFormDetails(form);
        let value = 0;

        if (form.form_name === 'Purchase Request') {
          if (details.grandTotal !== undefined) {
            value = parseFloat(details.grandTotal) || 0;
          } else if (details.subTotal !== undefined && details.vat !== undefined) {
            const subTotal = parseFloat(details.subTotal) || 0;
            const vat = parseFloat(details.vat) || 0;
            value = subTotal + vat;
          } else if (details.items && Array.isArray(details.items)) {
            value = details.items.reduce((sum, item) => {
              return sum + (parseFloat(item.amount) || 0);
            }, 0);
          }
        } else if (form.form_name === 'Major Capital Authorization Request') {
          let additionTotal = 0;
          let disposalTotal = 0;
          
          if (details.totalAdditionRequest !== undefined) {
            additionTotal = parseFloat(details.totalAdditionRequest) || 0;
          } else if (details.additionItems && Array.isArray(details.additionItems)) {
            additionTotal = details.additionItems.reduce((sum, item) => {
              return sum + (parseFloat(item.amount) || 0);
            }, 0);
          }
          
          if (details.totalDisposalRequest !== undefined) {
            disposalTotal = parseFloat(details.totalDisposalRequest) || 0;
          } else if (details.disposalItems && Array.isArray(details.disposalItems)) {
            disposalTotal = details.disposalItems.reduce((sum, item) => {
              return sum + (parseFloat(item.amount) || 0);
            }, 0);
          }
          
          value = additionTotal + disposalTotal;
        } else if (form.form_name === 'Minor Capital Authorization Request') {
          if (details.totals && details.totals.total !== undefined) {
            value = parseFloat(details.totals.total) || 0;
          } else if (details.totalAmount !== undefined) {
            value = parseFloat(details.totalAmount) || 0;
          } else if (details.items && Array.isArray(details.items)) {
            value = details.items.reduce((sum, item) => {
              return sum + (parseFloat(item.total) || 0);
            }, 0);
          }
        }

        if (form.department) {
          if (!deptMap[form.department]) {
            deptMap[form.department] = { total: 0, count: 0 };
          }
          deptMap[form.department].total += value;
          deptMap[form.department].count++;
        }

        if (form.form_name) {
          if (!formTypeMap[form.form_name]) {
            formTypeMap[form.form_name] = { total: 0, count: 0 };
          }
          formTypeMap[form.form_name].total += value;
          formTypeMap[form.form_name].count++;
        }
      } catch (err) {
        console.warn('Error processing chart data for form:', err.message);
      }
    });

    const dashArray = [
      {
        title: 'By Department',
        data: Object.keys(deptMap).map(d => ({
          label: d,
          total: deptMap[d].total,
          count: deptMap[d].count
        }))
      },
      {
        title: 'By Form Type',
        data: Object.keys(formTypeMap).map(f => ({
          label: f,
          total: formTypeMap[f].total,
          count: formTypeMap[f].count
        }))
      }
    ];
    
    return dashArray;
  }, []);

  const memoizedDashboardData = useMemo(() => {
    return processChartData(filteredForms);
  }, [filteredForms, processChartData]);

  useEffect(() => {
    setDashboardData(memoizedDashboardData);
  }, [memoizedDashboardData]);

  const processTimelineData = useCallback((data) => {
    if (!data || !Array.isArray(data) || data.length === 0 || !formTypes || formTypes.length === 0) {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: []
      };
    }

    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    formTypes.forEach(type => {
      monthlyData[type] = Array(12).fill(0);
    });

    data.forEach(form => {
      try {
        const details = parseFormDetails(form);
        const date = details.date || form.request_date;
        if (date) {
          const formDate = new Date(date);
          const month = formDate.getMonth();
          const year = formDate.getFullYear();
          
          if (year === selectedYear && form.form_name) {
            let value = 0;

            if (form.form_name === 'Purchase Request') {
              if (details.grandTotal !== undefined) {
                value = parseFloat(details.grandTotal) || 0;
              } else if (details.subTotal !== undefined && details.vat !== undefined) {
                const subTotal = parseFloat(details.subTotal) || 0;
                const vat = parseFloat(details.vat) || 0;
                value = subTotal + vat;
              } else if (details.items && Array.isArray(details.items)) {
                value = details.items.reduce((sum, item) => {
                  return sum + (parseFloat(item.amount) || 0);
                }, 0);
              }
            } else if (form.form_name === 'Major Capital Authorization Request') {
              let additionTotal = 0;
              let disposalTotal = 0;
              
              if (details.totalAdditionRequest !== undefined) {
                additionTotal = parseFloat(details.totalAdditionRequest) || 0;
              } else if (details.additionItems && Array.isArray(details.additionItems)) {
                additionTotal = details.additionItems.reduce((sum, item) => {
                  return sum + (parseFloat(item.amount) || 0);
                }, 0);
              }
              
              if (details.totalDisposalRequest !== undefined) {
                disposalTotal = parseFloat(details.totalDisposalRequest) || 0;
              } else if (details.disposalItems && Array.isArray(details.disposalItems)) {
                disposalTotal = details.disposalItems.reduce((sum, item) => {
                  return sum + (parseFloat(item.amount) || 0);
                }, 0);
              }
              
              value = additionTotal + disposalTotal;
            } else if (form.form_name === 'Minor Capital Authorization Request') {
              if (details.totals && details.totals.total !== undefined) {
                value = parseFloat(details.totals.total) || 0;
              } else if (details.totalAmount !== undefined) {
                value = parseFloat(details.totalAmount) || 0;
              } else if (details.items && Array.isArray(details.items)) {
                value = details.items.reduce((sum, item) => {
                  return sum + (parseFloat(item.total) || 0);
                }, 0);
              }
            }

            monthlyData[form.form_name][month] += value;
          }
        }
      } catch (err) {
        console.warn('Error processing timeline data for form:', err.message);
      }
    });

    const datasets = formTypes.map((type, index) => ({
      label: type,
      data: monthlyData[type] || Array(12).fill(0),
      backgroundColor: getChartColors(index, 0.2),
      borderColor: getChartColors(index),
      borderWidth: 2,
      tension: 0.4
    }));

    return {
      labels: monthNames,
      datasets
    };
  }, [formTypes, selectedYear]);

  const memoizedTimelineData = useMemo(() => {
    return processTimelineData(filteredForms);
  }, [filteredForms, processTimelineData]);

  useEffect(() => {
    setTimelineData(memoizedTimelineData);
  }, [memoizedTimelineData]);

  const applyFilters = useCallback(() => {
    if (!forms || forms.length === 0) {
      setFilteredForms([]);
      return;
    }

    let filtered = [...forms];

    if (selectedFormType !== 'all') {
      filtered = filtered.filter(form => form.form_name === selectedFormType);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(form => form.department === selectedDepartment);
    }

    filtered = filtered.filter(form => {
      try {
        const details = parseFormDetails(form);
        const date = details.date || form.request_date;
        if (date) {
          const year = new Date(date).getFullYear();
          return year === selectedYear;
        }
        return false;
      } catch (err) {
        console.warn('Error filtering by year:', err.message);
        return false;
      }
    });

    setFilteredForms(filtered);
  }, [forms, selectedFormType, selectedDepartment, selectedYear]);

  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setIsLoading(false);
        return;
      }
      
      const baseUrl = process.env.REACT_APP_API_URL || 'http://192.168.17.15:5000';
      const response = await axios.get(`${baseUrl}/api/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!Array.isArray(response.data)) {
        setError('Invalid data format received from the server');
        setIsLoading(false);
        return;
      }
      
      const nonDraftForms = response.data.filter(form => form.status !== 'Draft');
      setForms(nonDraftForms);

      const deptSet = new Set();
      nonDraftForms.forEach(form => {
        if (form.department && typeof form.department === 'string') {
          deptSet.add(form.department);
        }
      });
      setDepartments(Array.from(deptSet).sort());

      const formTypeSet = new Set();
      nonDraftForms.forEach(form => {
        if (form.form_name && typeof form.form_name === 'string') {
          formTypeSet.add(form.form_name);
        }
      });
      setFormTypes(Array.from(formTypeSet).sort());

      const years = new Set();
      const currentYear = new Date().getFullYear();
      years.add(currentYear);
      
      nonDraftForms.forEach(form => {
        try {
          const details = parseFormDetails(form);
          const date = details.date || form.request_date;
          if (date) {
            const year = new Date(date).getFullYear();
            if (!isNaN(year)) years.add(year);
          }
        } catch (err) {
          console.warn('Error parsing date:', err.message);
        }
      });
      setAvailableYears(Array.from(years).sort());
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error fetching forms:', error.response?.data || error.message);
      setError('Failed to load dashboard data. Please try again later.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    applyFilters();
  }, [forms, selectedFormType, selectedDepartment, selectedYear, applyFilters]);

  const parseFormDetails = (form) => {
    if (!form) return {};
    
    try {
      let details = {};
      
      if (form.details && typeof form.details === 'object' && form.details !== null) {
        details = form.details;
      } 
      else if (form.details && typeof form.details === 'string' && form.details.trim() !== '') {
        try {
          if (form._parsed_details) {
            return form._parsed_details;
          }
          
          details = JSON.parse(form.details);
          form._parsed_details = details;
        } catch (parseError) {
          console.warn('Error parsing form details string:', parseError.message);
        }
      }
      else if (typeof form === 'object' && form !== null) {
        details = { ...form };
        delete details.id;
        delete details.user_id;
        delete details.created_at;
        delete details.updated_at;
      }

      if (Object.keys(details).length === 0 && form.data) {
        if (typeof form.data === 'object' && form.data !== null) {
          details = form.data;
        } else if (typeof form.data === 'string' && form.data.trim() !== '') {
          try {
            if (form._parsed_data) {
              return form._parsed_data;
            }
            
            details = JSON.parse(form.data);
            form._parsed_data = details;
          } catch (parseError) {
            console.warn('Error parsing form.data string:', parseError.message);
          }
        }
      }

      if (Object.keys(details).length === 0 && form.formData) {
        if (typeof form.formData === 'object' && form.formData !== null) {
          details = form.formData;
        } else if (typeof form.formData === 'string' && form.formData.trim() !== '') {
          try {
            if (form._parsed_formData) {
              return form._parsed_formData;
            }
            
            details = JSON.parse(form.formData);
            form._parsed_formData = details;
          } catch (parseError) {
            console.warn('Error parsing formData string:', parseError.message);
          }
        }
      }

      if (!details.name && form.user_name) {
        details.name = form.user_name;
      }
      
      if (!details.department && form.department) {
        details.department = form.department;
      }

      if (form.form_name === 'Purchase Request' && details.items && details.items.length > 0) {
        if (!details.grandTotal && details.subTotal !== undefined) {
          const subTotal = parseFloat(details.subTotal) || 0;
          const vat = parseFloat(details.vat || 0);
          details.grandTotal = subTotal + vat;
          console.log(`คำนวณ grandTotal = ${subTotal} + ${vat} = ${details.grandTotal}`);
        }
      }

      if (form.form_name === 'Travel Request' && details.estimatedCost) {
        if (!details.estimatedCost.total && 
            (details.estimatedCost.airfare || 
             details.estimatedCost.accommodations || 
             details.estimatedCost.mealsEntertainment || 
             details.estimatedCost.other)) {
          
          const airfare = parseFloat(details.estimatedCost.airfare || 0) || 0;
          const accommodations = parseFloat(details.estimatedCost.accommodations || 0) || 0;
          const mealsEntertainment = parseFloat(details.estimatedCost.mealsEntertainment || 0) || 0;
          const other = parseFloat(details.estimatedCost.other || 0) || 0;
          
          details.estimatedCost.total = airfare + accommodations + mealsEntertainment + other;
          console.log(`คำนวณ estimatedCost.total = ${airfare} + ${accommodations} + ${mealsEntertainment} + ${other} = ${details.estimatedCost.total}`);
        }
      }

      console.log(`parseFormDetails สำเร็จสำหรับฟอร์ม ${form.form_name} (ID: ${form.id}):`, details);
      return details;
    } catch (err) {
      console.warn('Failed to parse form details:', err.message);
      return {};
    }
  };

  const getChartColors = (index, alpha = 1) => {
    const colors = [
      `rgba(45, 127, 222, ${alpha})`,
      `rgba(76, 175, 80, ${alpha})`,
      `rgba(255, 152, 0, ${alpha})`,
      `rgba(156, 39, 176, ${alpha})`,
      `rgba(244, 67, 54, ${alpha})`,
      `rgba(0, 188, 212, ${alpha})`,
      `rgba(255, 193, 7, ${alpha})`,
      `rgba(121, 85, 72, ${alpha})`,
    ];
    return colors[index % colors.length];
  };

  const prepareDeptChartData = () => {
    if (!dashboardData[0] || !dashboardData[0].data || dashboardData[0].data.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [{ 
          label: 'Total Value', 
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.7)']
        }] 
      };
    }
    
    const byDept = dashboardData[0];
    return {
      labels: byDept.data.map(d => d.label),
      datasets: [
        {
          label: 'Total Value',
          data: byDept.data.map(d => d.total),
          backgroundColor: byDept.data.map((_, i) => getChartColors(i))
        }
      ]
    };
  };

  const prepareFormTypeChartData = () => {
    if (!dashboardData[1] || !dashboardData[1].data || dashboardData[1].data.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [{ 
          label: 'Total Value', 
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.7)']
        }] 
      };
    }
    
    const byFormType = dashboardData[1];
    return {
      labels: byFormType.data.map(d => d.label),
      datasets: [
        {
          label: 'Total Value',
          data: byFormType.data.map(d => d.total),
          backgroundColor: byFormType.data.map((_, i) => getChartColors(i))
        }
      ]
    };
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      title: {
        display: true,
        text: 'Total Value (THB)'
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return Number(value).toLocaleString('en-US');
          }
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Trend (THB)'
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return Number(value).toLocaleString('en-US');
          }
        }
      }
    }
  };

  const prepareStatusChartData = () => {
    if (Object.keys(summaryData.formsByStatus).length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: [
              'rgba(200, 200, 200, 0.7)'
            ]
          }
        ]
      };
    }
    
    const statusLabels = Object.keys(summaryData.formsByStatus);
    const backgroundColors = statusLabels.map(status => {
      switch(status.toLowerCase()) {
        case 'approved':
        case 'approve': 
          return 'rgba(76, 175, 80, 0.8)';
        case 'waiting for approve': 
          return 'rgba(255, 193, 7, 0.8)';
        case 'rejected':
        case 'reject': 
          return 'rgba(229, 62, 62, 0.8)';
        case 'draft': 
          return 'rgba(113, 128, 150, 0.8)';
        default: 
          return 'rgba(160, 174, 192, 0.8)';
      }
    });
    
    return {
      labels: statusLabels,
      datasets: [
        {
          data: Object.values(summaryData.formsByStatus),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  };

  if (isLoading) {
    return (
      <div className="dashboard-container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container error-container">
        <div className="error-icon">❌</div>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={fetchForms}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📊 Executive Dashboard</h1>
      
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Form Type:</label>
          <select 
            value={selectedFormType} 
            onChange={(e) => setSelectedFormType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            {formTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Department:</label>
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="filter-select"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card total-forms">
          <h3>Total Forms</h3>
          <div className="summary-value">{summaryData.totalForms}</div>
        </div>
        
        <div className="summary-card approved-value">
          <h3>Approved Value</h3>
          <div className="summary-value">
            {summaryData.totalValueApproved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
          </div>
        </div>
        
        <div className="summary-card pending-value">
          <h3>Pending Value</h3>
          <div className="summary-value">
            {summaryData.totalValuePending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Total Value by Department</h2>
          <div className="chart-wrapper">
            <Bar data={prepareDeptChartData()} options={barOptions} />
          </div>
        </div>
        
        <div className="dashboard-card">
          <h2>Total Value by Form Type</h2>
          <div className="chart-wrapper">
            <Bar data={prepareFormTypeChartData()} options={barOptions} />
          </div>
        </div>
        
        <div className="dashboard-card">
          <h2>Forms by Status</h2>
          <div className="chart-wrapper">
            <Pie data={prepareStatusChartData()} />
          </div>
        </div>
        
        <div className="dashboard-card full-width">
          <h2>Monthly Value Trend ({selectedYear})</h2>
          <div className="chart-wrapper">
            <Line data={timelineData} options={lineOptions} />
          </div>
        </div>
      </div>

      <div className="forms-section">
        <h2 className="all-forms-title">📝 All Forms (Filtered)</h2>
        {filteredForms.length === 0 ? (
          <p>🔄 No forms match the selected criteria</p>
        ) : (
          <table className="forms-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Form Type</th>
                <th>Created By</th>
                <th>Department</th>
                <th>Value</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map((form) => {
                let value = 0;
                try {
                  const details = parseFormDetails(form);
                  console.log(`Form ID ${form.id} - ${form.form_name}:`, details);
                  
                  if (form.form_name === 'Purchase Request') {
                    console.log("Purchase Request Raw data:", details);

                    if (typeof details.grandTotal !== 'undefined') {
                      value = parseFloat(details.grandTotal) || 0;
                    } else if (details.subTotal && details.vat) {
                      const subTotal = parseFloat(details.subTotal) || 0;
                      const vat = parseFloat(details.vat) || 0;
                      value = subTotal + vat;
                    } else if (details.items && Array.isArray(details.items)) {
                      value = details.items.reduce((sum, item) => {
                        return sum + (parseFloat(item.amount) || 0);
                      }, 0);
                    } else if (details.prForm && details.prForm.summary) {
                      const summary = details.prForm.summary;
                      if (typeof summary.grandTotal !== 'undefined') {
                        value = parseFloat(summary.grandTotal) || 0;
                      } else if (typeof summary.subTotal !== 'undefined') {
                        const subTotal = parseFloat(summary.subTotal) || 0;
                        const vat = parseFloat(summary.vat) || 0;
                        value = subTotal + vat;
                      }
                    } else if (details.prItems && Array.isArray(details.prItems)) {
                      value = details.prItems.reduce((sum, item) => {
                        return sum + (parseFloat(item.amount) || 0);
                      }, 0);
                    } else if (details.summary) {
                      if (details.summary.grandTotal !== undefined) {
                        value = parseFloat(details.summary.grandTotal) || 0;
                      } else if (details.summary.subTotal !== undefined) {
                        const subTotal = parseFloat(details.summary.subTotal) || 0;
                        const vat = parseFloat(details.summary.vat) || 0;
                        value = subTotal + vat;
                      }
                    } else if (details.purchaseItems && Array.isArray(details.purchaseItems)) {
                      value = details.purchaseItems.reduce((sum, item) => {
                        return sum + (parseFloat(item.amount) || 0);
                      }, 0);
                    }
                    
                    console.log(`${form.form_name} - grandTotal:`, details.grandTotal, 'Value:', value);
                  } else if (form.form_name === 'Travel Request') {
                    console.log("Travel Request Raw data:", details);
                    
                    if (typeof details.total !== 'undefined') {
                      value = parseFloat(details.total) || 0;
                    } else if (details.estimatedCost && typeof details.estimatedCost.total !== 'undefined') {
                      value = parseFloat(details.estimatedCost.total) || 0;
                    } else if (details.estimatedCost) {
                      let total = 0;
                      if (typeof details.estimatedCost.airfare !== 'undefined') total += parseFloat(details.estimatedCost.airfare) || 0;
                      if (typeof details.estimatedCost.accommodation !== 'undefined') total += parseFloat(details.estimatedCost.accommodation) || 0;
                      if (typeof details.estimatedCost.meals !== 'undefined') total += parseFloat(details.estimatedCost.meals) || 0;
                      if (typeof details.estimatedCost.others !== 'undefined') total += parseFloat(details.estimatedCost.others) || 0;
                      value = total;
                    } else if (details.tripDetails && details.tripDetails.estimatedCost) {
                      const est = details.tripDetails.estimatedCost;
                      if (typeof est.total !== 'undefined') {
                        value = parseFloat(est.total) || 0;
                      } else {
                        let total = 0;
                        if (typeof est.airfare !== 'undefined') total += parseFloat(est.airfare) || 0;
                        if (typeof est.accommodation !== 'undefined') total += parseFloat(est.accommodation) || 0;
                        if (typeof est.meals !== 'undefined') total += parseFloat(est.meals) || 0;
                        if (typeof est.others !== 'undefined') total += parseFloat(est.others) || 0;
                        value = total;
                      }
                    }
                    
                    if (value === 0) {
                      const totalKeys = Object.keys(details).filter(key => 
                        key.toLowerCase().includes('total') || 
                        key.toLowerCase().includes('cost') || 
                        key.toLowerCase().includes('amount') || 
                        key.toLowerCase().includes('estimate')
                      );
                      
                      for (const key of totalKeys) {
                        if (typeof details[key] === 'number') {
                          value = details[key];
                          console.log(`ค้นพบค่า Travel Request จากคีย์ ${key}:`, value);
                          break;
                        } else if (typeof details[key] === 'string' && !isNaN(parseFloat(details[key]))) {
                          value = parseFloat(details[key]);
                          console.log(`ค้นพบค่า Travel Request จากคีย์ ${key}:`, value);
                          break;
                        } else if (typeof details[key] === 'object' && details[key] !== null) {
                          const nestedObj = details[key];
                          if (typeof nestedObj.total === 'number' || 
                             (typeof nestedObj.total === 'string' && !isNaN(parseFloat(nestedObj.total)))) {
                            value = parseFloat(nestedObj.total);
                            console.log(`ค้นพบค่า Travel Request จากคีย์ ${key}.total:`, value);
                            break;
                          }
                          
                          let calcTotal = 0;
                          let foundValues = false;
                          
                          ['airfare', 'air', 'flight', 'ticket', 'accommodation', 'hotel', 'room', 
                           'meals', 'food', 'entertainment', 'others', 'other', 'misc', 'miscellaneous'].forEach(costType => {
                            if (nestedObj[costType] !== undefined) {
                              const costValue = parseFloat(nestedObj[costType]) || 0;
                              if (costValue > 0) {
                                calcTotal += costValue;
                                foundValues = true;
                              }
                            }
                          });
                          
                          if (foundValues) {
                            value = calcTotal;
                            console.log(`ค้นพบค่า Travel Request โดยรวมจากคีย์ ${key} ต่างๆ:`, value);
                            break;
                          }
                        }
                      }
                    }
                    
                    console.log(`${form.form_name} - total:`, details.total, 'estimatedCost:', details.estimatedCost, 'Value:', value);
                  } else if (form.form_name === 'Major Capital Authorization Request') {
                    console.log("Table - Major Capital Raw data:", details);
                    
                    let disposalTotal = 0;
                    let additionTotal = 0;
                    
                    if (details.totalAdditionRequest !== undefined) {
                      additionTotal = parseFloat(details.totalAdditionRequest) || 0;
                    }
                    
                    if (details.totalDisposalRequest !== undefined) {
                      disposalTotal = parseFloat(details.totalDisposalRequest) || 0;
                    }
                    
                    if (additionTotal === 0 && details.mainForm && details.mainForm.totalAdditionRequest) {
                      additionTotal = parseFloat(details.mainForm.totalAdditionRequest) || 0;
                    }
                    
                    if (disposalTotal === 0 && details.mainForm && details.mainForm.totalDisposalRequest) {
                      disposalTotal = parseFloat(details.mainForm.totalDisposalRequest) || 0;
                    }
                    
                    if (additionTotal === 0 && details["Total Addition Request"]) {
                      additionTotal = parseFloat(details["Total Addition Request"]) || 0;
                    }
                    
                    if (disposalTotal === 0 && details["Total Disposal Request"]) {
                      disposalTotal = parseFloat(details["Total Disposal Request"]) || 0;
                    }
                    
                    if (additionTotal === 0 && details["totalAddition"]) {
                      additionTotal = parseFloat(details["totalAddition"]) || 0;
                    }

                    if (disposalTotal === 0 && details["totalDisposal"]) {
                      disposalTotal = parseFloat(details["totalDisposal"]) || 0;
                    }

                    if (additionTotal === 0 && disposalTotal === 0 && details.capitalForm) {
                      if (details.capitalForm.totalAdditionRequest !== undefined) {
                        additionTotal = parseFloat(details.capitalForm.totalAdditionRequest) || 0;
                      }
                      if (details.capitalForm.totalDisposalRequest !== undefined) {
                        disposalTotal = parseFloat(details.capitalForm.totalDisposalRequest) || 0;
                      }
                    }

                    if (additionTotal === 0 && details["Addition Request Total"]) {
                      additionTotal = parseFloat(details["Addition Request Total"]) || 0;
                    }

                    if (disposalTotal === 0 && details["Disposal Request Total"]) {
                      disposalTotal = parseFloat(details["Disposal Request Total"]) || 0;
                    }
                    
                    if (additionTotal === 0 && details.totaladditionrequest !== undefined) {
                      additionTotal = parseFloat(details.totaladditionrequest) || 0;
                    }
                    
                    if (disposalTotal === 0 && details.totaldisposalrequest !== undefined) {
                      disposalTotal = parseFloat(details.totaldisposalrequest) || 0;
                    }
                    
                    const additionKeys = Object.keys(details).filter(key => 
                      (key.toLowerCase().includes('addition') && 
                      key.toLowerCase().includes('total')) || 
                      key.toLowerCase().includes('request')
                    );
                    
                    const disposalKeys = Object.keys(details).filter(key => 
                      (key.toLowerCase().includes('disposal') && 
                      key.toLowerCase().includes('total')) || 
                      key.toLowerCase().includes('request')
                    );
                    
                    if (additionTotal === 0 && additionKeys.length > 0) {
                      for (const key of additionKeys) {
                        if (typeof details[key] === 'number' || 
                           (typeof details[key] === 'string' && !isNaN(parseFloat(details[key])))) {
                          additionTotal = parseFloat(details[key]) || 0;
                          console.log(`ค้นพบ additionTotal จากคีย์: ${key}:`, additionTotal);
                          break;
                        }
                      }
                    }
                    
                    if (disposalTotal === 0 && disposalKeys.length > 0) {
                      for (const key of disposalKeys) {
                        if (typeof details[key] === 'number' || 
                           (typeof details[key] === 'string' && !isNaN(parseFloat(details[key])))) {
                          disposalTotal = parseFloat(details[key]) || 0;
                          console.log(`ค้นพบ disposalTotal จากคีย์: ${key}:`, disposalTotal);
                          break;
                        }
                      }
                    }
                    
                    value = disposalTotal + additionTotal;
                    console.log(`Table - ${form.form_name} - ค่าที่ถูกต้อง:`, value, 'โดยมาจาก disposalTotal:', disposalTotal, 'additionTotal:', additionTotal);
                  } else if (form.form_name === 'Minor Capital Authorization Request') {
                    if (details.totals && details.totals.total) {
                      value = parseFloat(details.totals.total) || 0;
                    } else {
                      value = parseFloat(details.totalAmount) || 0;
                    }
                    console.log(`${form.form_name} - totals:`, details.totals, 'totalAmount:', details.totalAmount, 'Value:', value);
                  }
                } catch (err) {}

                return (
                  <tr key={form.id}>
                    <td>{form.id}</td>
                    <td>{form.form_name}</td>
                    <td>{form.user_name}</td>
                    <td>{form.department}</td>
                    <td>{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      {form.request_date ? 
                        new Date(form.request_date).toLocaleString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                        : '-'
                      }
                    </td>
                    <td>
                      <span className={`status-badge status-${form.status ? form.status.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
                        {form.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/view/${form.id}`} className="action-link">🔎 View Details</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 