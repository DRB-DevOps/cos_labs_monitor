import React from 'react';
import { Menu, Layout } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, TeamOutlined, ProjectOutlined, UserOutlined, BarChartOutlined, CalendarOutlined, DatabaseOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  return (
    <Sider width={220} collapsible collapsed={collapsed} style={{ background: '#fff' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
      >
        <Menu.Item key="/" icon={<DashboardOutlined />}>
          <Link to="/">대시보드</Link>
        </Menu.Item>
        <Menu.Item key="/analytics" icon={<BarChartOutlined />}>
          <Link to="/analytics">분석/시각화</Link>
        </Menu.Item>
        <Menu.Divider />
        <Menu.SubMenu key="/data" icon={<DatabaseOutlined />} title="데이터조회/관리">
          <Menu.Item key="/labs" icon={<TeamOutlined />}>
            <Link to="/labs">랩 관리</Link>
          </Menu.Item>
          <Menu.Item key="/projects" icon={<ProjectOutlined />}>
            <Link to="/projects">프로젝트</Link>
          </Menu.Item>
          <Menu.Item key="/personnel" icon={<UserOutlined />}>
            <Link to="/personnel">인적자원</Link>
          </Menu.Item>
          <Menu.Item key="/activities" icon={<CalendarOutlined />}>
            <Link to="/activities">활동 기록</Link>
          </Menu.Item>
          <Menu.Item key="/costs" icon={<BarChartOutlined />}>
            <Link to="/costs">비용 관리</Link>
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </Sider>
  );
};

export default Sidebar; 