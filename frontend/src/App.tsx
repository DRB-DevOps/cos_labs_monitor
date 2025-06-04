import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import 'antd/dist/reset.css';
import './App.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Projects from './pages/Projects';
import Personnel from './pages/Personnel';
import Activities from './pages/Activities';
import Analytics from './pages/Analytics';
import Costs from './pages/Costs';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ConfigProvider locale={koKR}>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar collapsed={collapsed} />
          <Layout>
            <Header collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/labs" element={<Labs />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/personnel" element={<Personnel />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/costs" element={<Costs />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
