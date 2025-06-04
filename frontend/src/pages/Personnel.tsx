import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Select } from 'antd';
import { fetchPersonnel, createPersonnel, updatePersonnel, deletePersonnel, fetchLabs } from '../services/api';
import { Personnel, PersonnelInput } from '../types/personnel';
import { Lab } from '../types/lab';

const PersonnelPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Personnel | null>(null);
  const [form] = Form.useForm();

  const loadPersonnel = async () => {
    setLoading(true);
    try {
      const [personnel, labs] = await Promise.all([fetchPersonnel(), fetchLabs()]);
      setPersonnel(personnel);
      setLabs(labs);
    } catch {
      message.error('인적자원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const handleAddPersonnel = async (values: any) => {
    const payload: PersonnelInput = {
      employee_id: values.employee_id,
      name: values.name,
      email: values.email,
      ms_teams_id: values.ms_teams_id,
      position: values.position,
      lab_ids: values.lab_ids || [],
    };
    try {
      if (editMode && currentPerson) {
        await updatePersonnel(currentPerson.id, payload);
        message.success('인적자원이 수정되었습니다.');
      } else {
        await createPersonnel(payload);
        message.success('인적자원이 등록되었습니다.');
      }
      setModalOpen(false);
      setEditMode(false);
      setCurrentPerson(null);
      form.resetFields();
      loadPersonnel();
    } catch {
      message.error(editMode ? '인적자원 수정에 실패했습니다.' : '인적자원 등록에 실패했습니다.');
    }
  };

  const handleEdit = (person: Personnel) => {
    setEditMode(true);
    setCurrentPerson(person);
    setModalOpen(true);
    form.setFieldsValue({
      employee_id: person.employee_id,
      name: person.name,
      email: person.email,
      ms_teams_id: person.ms_teams_id,
      position: person.position,
      lab_ids: person.labs?.map(l => l.id) || [],
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePersonnel(id);
      message.success('인적자원이 삭제되었습니다.');
      loadPersonnel();
    } catch {
      message.error('인적자원 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>인적자원 관리</h2>
      <Button type="primary" onClick={() => { setModalOpen(true); setEditMode(false); setCurrentPerson(null); form.resetFields(); }} style={{ marginBottom: 16 }}>
        인적자원 추가
      </Button>
      <Table
        dataSource={personnel}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '사번', dataIndex: 'employee_id', key: 'employee_id' },
          { title: '이름', dataIndex: 'name', key: 'name' },
          { title: '이메일', dataIndex: 'email', key: 'email' },
          { title: 'MS Teams', dataIndex: 'ms_teams_id', key: 'ms_teams_id' },
          { title: '직급', dataIndex: 'position', key: 'position' },
          { title: '소속랩', dataIndex: 'labs', key: 'labs', render: (labs: Lab[], record: Personnel) => labs?.map(l => l.name).join(', ') },
          {
            title: '관리',
            key: 'action',
            render: (_, record: Personnel) => (
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
        title={editMode ? '인적자원 수정' : '인적자원 추가'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditMode(false); setCurrentPerson(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddPersonnel}>
          <Form.Item name="employee_id" label="사번" rules={[{ required: true, message: '사번을 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="이메일" rules={[{ required: true, message: '이메일을 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="ms_teams_id" label="MS Teams ID">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="직급">
            <Input />
          </Form.Item>
          <Form.Item name="lab_ids" label="소속랩" rules={[{ required: true, message: '소속랩을 선택하세요.' }]}> 
            <Select mode="multiple" options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PersonnelPage; 