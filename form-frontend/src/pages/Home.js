import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../components/Home.css';

// Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Home = () => {
  const [forms, setForms] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      // แก้ให้ชี้ไปที่ IP/PORT ของ Server ที่ถูกต้อง
      const response = await axios.get('http://192.168.17.15:5000/api/forms');
      setForms(response.data);

      const currentYear = new Date().getFullYear();
      const purchaseRequests = response.data.filter(f => f.form_name === 'Purchase Request');

      const deptMap = {};
      purchaseRequests.forEach((form) => {
        let details = {};
        try {
          details = JSON.parse(form.details);
        } catch (err) {}
        const formYear = details.date ? new Date(details.date).getFullYear() : null;
        if (formYear === currentYear) {
          const dept = form.department || 'Unknown Department';
          const grand = parseFloat(details.grandTotal) || 0;
          if (!deptMap[dept]) {
            deptMap[dept] = { total: 0, count: 0 };
          }
          deptMap[dept].total += grand;
          deptMap[dept].count += 1;
        }
      });

      const dashArray = Object.keys(deptMap).map(d => ({
        department: d,
        total: deptMap[d].total,
        count: deptMap[d].count
      }));
      setDashboardData(dashArray);

    } catch (error) {
      console.error('❌ Error fetching forms:', error);
    }
  };

  const deleteForm = async (id) => {
    if (window.confirm("ต้องการลบฟอร์มนี้จริงหรือไม่?")) {
      try {
        await axios.delete(`http://192.168.17.15:5000/api/forms/${id}`);
        fetchForms();
      } catch (error) {
        console.error('❌ Error deleting form:', error);
      }
    }
  };

  // เตรียมข้อมูลสำหรับ Charts
  const labels = dashboardData.map(d => d.department);
  const totals = dashboardData.map(d => d.total);

  // สร้างสีสำหรับแต่ละ Department
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#F690B8', '#66DDAA',
    '#C19A6B', '#87CEEB', '#CD5C5C', '#7FFFD4'
  ];
  const backgroundColors = labels.map((_, i) => colors[i % colors.length]);

  const barData = {
    labels,
    datasets: [
      {
        label: 'Total Grand',
        data: totals,
        backgroundColor: backgroundColors
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            // ถ้า value เป็น Number, แปลงเป็น String
            return Number(value).toLocaleString('en-US');
          }
        }
      }
    }
  };

  const pieData = {
    labels,
    datasets: [
      {
        label: 'Total Grand',
        data: totals,
        backgroundColor: backgroundColors
      }
    ]
  };

  return (
    <div className="home-container">
      <div className="dashboard-section">
        <h1 className="dashboard-title">📊 Dashboard - Purchase Requests (Current Year)</h1>
        {dashboardData.length === 0 ? (
          <p>ยังไม่มีข้อมูล Purchase Request ของปีนี้</p>
        ) : (
          <div className="dashboard-cards">
            {/* Summary Table */}
            <div className="dashboard-card">
              <h2>Summary Table</h2>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Count</th>
                    <th>Total (Grand)</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.map((row) => (
                    <tr key={row.department}>
                      <td>{row.department}</td>
                      <td>{row.count}</td>
                      <td>{row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar Chart */}
            <div className="dashboard-card">
              <h2>Bar Chart</h2>
              <div className="chart-wrapper">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="dashboard-card">
              <h2>Pie Chart</h2>
              <div className="chart-wrapper">
                <Pie data={pieData} />
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 className="all-forms-title">📝 All Forms in system</h2>
      {forms.length === 0 ? (
        <p>🔄 ไม่มีข้อมูลฟอร์ม</p>
      ) : (
        <table className="forms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Form Name</th>
              <th>User</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>{form.id}</td>
                <td>{form.form_name}</td>
                <td>{form.user_name}</td>
                <td>{form.department}</td>
                <td>
                  <Link to={`/view/${form.id}`} className="action-link">🔎 see</Link> | 
                  <button className="delete-btn" onClick={() => deleteForm(form.id)}>🗑 Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Home;
