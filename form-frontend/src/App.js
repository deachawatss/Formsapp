import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PurchaseRequestForm from './pages/PurchaseRequestForm';
import CapexRequestForm from './pages/CapexRequestForm';
import TravelRequestForm from './pages/TravelRequestForm';
import Home from './pages/Home';
import NewForm from './pages/NewForm';    
import ViewForm from './pages/ViewForm';
import './App.css';  

function App() {
    return (
        <Router>
            <Header />
            <div className="app-container"style={{ marginTop: '50px' }}>
                <Sidebar />
                <div className="content-container">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/new" element={<NewForm />} />
                        <Route path="/view/:id" element={<ViewForm />} />
                        <Route path="/form/purchase-request" element={<PurchaseRequestForm />} />
                        <Route path="/form/capex-request" element={<CapexRequestForm />} />
                        <Route path="/form/travel-request" element={<TravelRequestForm />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
