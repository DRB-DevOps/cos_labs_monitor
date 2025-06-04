import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Popconfirm, Space } from 'antd';
import { fetchProjects, createProject, updateProject, deleteProject, fetchLabs } from '../services/api';
import { Project, ProjectInput } from '../types/project';
import { Lab } from '../types/lab';
import dayjs from 'dayjs';

const statusOptions = [
  { label: '진행중', value: 'active' },
  { label: '완료', value: 'completed' },
  { label: '중단', value: 'suspended' },
  { label: '미상', value: 'unknown' },
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [data, labs] = await Promise.all([fetchProjects(), fetchLabs()]);
      setProjects(data);
      setLabs(labs);
    } catch {
      message.error('프로젝트 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAddProject = async (values: any) => {
    const payload: ProjectInput = {
      code: values.code,
      name: values.name,
      description: values.description,
      start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      status: values.status,
      lead_lab_id: values.lead_lab_id,
      lab_ids: values.lab_ids || [],
    };
    try {
      if (editMode && currentProject) {
        await updateProject(currentProject.id, payload);
        message.success('프로젝트가 수정되었습니다.');
      } else {
        await createProject(payload);
        message.success('프로젝트가 등록되었습니다.');
      }
      setModalOpen(false);
      setEditMode(false);
      setCurrentProject(null);
      form.resetFields();
      loadProjects();
    } catch {
      message.error(editMode ? '프로젝트 수정에 실패했습니다.' : '프로젝트 등록에 실패했습니다.');
    }
  };

  const handleEdit = (project: Project) => {
    setEditMode(true);
    setCurrentProject(project);
    setModalOpen(true);
    form.setFieldsValue({
      code: project.code,
      name: project.name,
      description: project.description,
      start_date: project.start_date ? dayjs(project.start_date) : undefined,
      end_date: project.end_date ? dayjs(project.end_date) : undefined,
      status: project.status,
      lead_lab_id: project.lead_lab?.id,
      lab_ids: project.labs?.map(l => l.id) || [],
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id);
      message.success('프로젝트가 삭제되었습니다.');
      loadProjects();
    } catch {
      message.error('프로젝트 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>프로젝트 관리</h2>
      <Button type="primary" onClick={() => { setModalOpen(true); setEditMode(false); setCurrentProject(null); form.resetFields(); }} style={{ marginBottom: 16 }}>
        프로젝트 추가
      </Button>
      <Table
        dataSource={projects}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '코드', dataIndex: 'code', key: 'code' },
          { title: '이름', dataIndex: 'name', key: 'name' },
          { title: '설명', dataIndex: 'description', key: 'description' },
          { title: '시작일', dataIndex: 'start_date', key: 'start_date' },
          { title: '종료일', dataIndex: 'end_date', key: 'end_date' },
          { title: '상태', dataIndex: 'status', key: 'status' },
          { title: '주도랩', dataIndex: ['lead_lab', 'name'], key: 'lead_lab', render: (_: any, record: Project) => record.lead_lab?.name },
          { title: '참여랩', dataIndex: 'labs', key: 'labs', render: (labs: Lab[], record: Project) => labs?.map(l => l.name).join(', ') },
          {
            title: '관리',
            key: 'action',
            render: (_, record: Project) => (
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
        title={editMode ? '프로젝트 수정' : '프로젝트 추가'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditMode(false); setCurrentProject(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddProject}>
          <Form.Item name="code" label="프로젝트 코드" rules={[{ required: true, message: '코드를 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="name" label="프로젝트 이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="start_date" label="시작일">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="종료일">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="상태" initialValue="active">
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="lead_lab_id" label="주도랩" rules={[{ required: true, message: '주도랩을 선택하세요.' }]}> 
            <Select options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="lab_ids" label="참여/지원랩" rules={[{ required: true, message: '참여/지원랩을 선택하세요.' }]}> 
            <Select mode="multiple" options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects; 