import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import { fetchDashboardData } from '../services/api';
import { DashboardData } from '../types/dashboard';
import { TeamOutlined, ProjectOutlined, FieldTimeOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData()
      .then(setData)
      .catch(() => message.error('대시보드 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>대시보드</h2>
      {loading ? (
        <Spin size="large" />
      ) : data ? (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="전체 랩 수" value={data.total_labs} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="전체 프로젝트 수" value={data.total_projects} prefix={<ProjectOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="최근 30일 총 투입시간" value={data.total_hours} suffix="시간" prefix={<FieldTimeOutlined />} precision={1} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="활성 인원 수" value={data.active_personnel} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic title="최근 30일 총 비용" value={data.total_cost} prefix={<DollarOutlined />} suffix="원" precision={0} />
            </Card>
          </Col>
        </Row>
      ) : (
        <p>데이터가 없습니다.</p>
      )}
    </div>
  );
};

export default Dashboard; 