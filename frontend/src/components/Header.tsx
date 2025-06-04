import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => (
  <AntHeader style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
    <Button
      type="text"
      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      onClick={onToggle}
      style={{ fontSize: 20, marginRight: 16 }}
    />
    <Typography.Title level={3} style={{ margin: 0 }}>
      DRB Future Labs Analytics
    </Typography.Title>
  </AntHeader>
);

export default Header; 