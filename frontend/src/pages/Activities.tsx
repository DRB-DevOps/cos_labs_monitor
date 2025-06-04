import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Popconfirm, Space } from 'antd';
import { fetchActivities, createActivity, updateActivity, deleteActivity, fetchLabs, fetchPersonnel, fetchProjects } from '../services/api';
import { Activity, ActivityInput } from '../types/activity';
import { Lab } from '../types/lab';
import { Personnel } from '../types/personnel';
import { Project } from '../types/project';
import dayjs from 'dayjs';

const activityTypeOptions = [
  { label: '고유 활동', value: 'own' },
  { label: '지원 활동', value: 'support' },
];

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [acts, labs, pers, projs] = await Promise.all([
        fetchActivities(), fetchLabs(), fetchPersonnel(), fetchProjects()
      ]);
      setActivities(acts);
      setLabs(labs);
      setPersonnel(pers);
      setProjects(projs);
    } catch {
      message.error('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddActivity = async (values: any) => {
    const payload: ActivityInput = {
      ...values,
      hours: Number(values.hours),
      activity_date: values.activity_date.format('YYYY-MM-DD'),
    };
    try {
      if (editMode && currentActivity) {
        await updateActivity(currentActivity.id, payload);
        message.success('활동이 수정되었습니다.');
      } else {
        await createActivity(payload);
        message.success('활동이 등록되었습니다.');
      }
      setModalOpen(false);
      setEditMode(false);
      setCurrentActivity(null);
      form.resetFields();
      loadAll();
    } catch {
      message.error(editMode ? '활동 수정에 실패했습니다.' : '활동 등록에 실패했습니다.');
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditMode(true);
    setCurrentActivity(activity);
    setModalOpen(true);
    form.setFieldsValue({
      activity_date: dayjs(activity.activity_date),
      personnel_id: personnel.find(p => p.name === activity.personnel_name)?.id,
      lab_id: labs.find(l => l.name === activity.lab_name)?.id,
      project_id: projects.find(p => p.name === activity.project_name)?.id,
      hours: activity.hours,
      activity_type: activity.activity_type,
      supported_lab_id: labs.find(l => l.name === activity.supported_lab_name)?.id,
      description: activity.description,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteActivity(id);
      message.success('활동이 삭제되었습니다.');
      loadAll();
    } catch {
      message.error('활동 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>활동 관리</h2>
      <Button type="primary" onClick={() => { setModalOpen(true); setEditMode(false); setCurrentActivity(null); form.resetFields(); }} style={{ marginBottom: 16 }}>
        활동 추가
      </Button>
      <Table
        dataSource={activities}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '일자', dataIndex: 'activity_date', key: 'activity_date' },
          { title: '인적자원', dataIndex: 'personnel_name', key: 'personnel_name' },
          { title: '랩', dataIndex: 'lab_name', key: 'lab_name' },
          { title: '프로젝트', dataIndex: 'project_name', key: 'project_name' },
          { title: '투입시간', dataIndex: 'hours', key: 'hours' },
          { title: '활동유형', dataIndex: 'activity_type', key: 'activity_type', render: (v: string) => v === 'own' ? '고유' : '지원' },
          { title: '지원대상랩', dataIndex: 'supported_lab_name', key: 'supported_lab_name' },
          { title: '설명', dataIndex: 'description', key: 'description' },
          {
            title: '관리',
            key: 'action',
            render: (_, record: Activity) => (
              <Space>
                <Button size="small" onClick={() => handleEdit(record)}>
                  수정
                </Button>
                <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)} okText="삭제" cancelText="취소">
                  <Button size="small" danger>
                    삭제
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editMode ? '활동 수정' : '활동 추가'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditMode(false); setCurrentActivity(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddActivity}>
          <Form.Item name="activity_date" label="일자" rules={[{ required: true, message: '일자를 선택하세요.' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="personnel_id" label="인적자원" rules={[{ required: true, message: '인적자원을 선택하세요.' }]}> 
            <Select options={personnel.map(p => ({ label: p.name, value: p.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="lab_id" label="랩" rules={[{ required: true, message: '랩을 선택하세요.' }]}> 
            <Select options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="project_id" label="프로젝트">
            <Select options={[{ label: '미상', value: undefined }, ...projects.map(p => ({ label: p.name, value: p.id }))]} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="hours" label="투입시간(시간)" rules={[{ required: true, message: '투입시간을 입력하세요.' }]}> 
            <InputNumber min={0.1} max={24} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="activity_type" label="활동유형" initialValue="own" rules={[{ required: true }]}> 
            <Select options={activityTypeOptions} />
          </Form.Item>
          <Form.Item name="supported_lab_id" label="지원대상랩">
            <Select options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Activities; 