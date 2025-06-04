import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd';
import { fetchLabs, createLab, updateLab, deleteLab } from '../services/api';
import { Lab, LabInput } from '../types/lab';

const Labs: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentLab, setCurrentLab] = useState<Lab | null>(null);
  const [form] = Form.useForm();

  const loadLabs = async () => {
    setLoading(true);
    try {
      const data = await fetchLabs();
      setLabs(data);
    } catch {
      message.error('랩 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const handleAddLab = async (values: LabInput) => {
    try {
      if (editMode && currentLab) {
        await updateLab(currentLab.id, values);
        message.success('랩이 수정되었습니다.');
      } else {
        await createLab(values);
        message.success('랩이 등록되었습니다.');
      }
      setModalOpen(false);
      setEditMode(false);
      setCurrentLab(null);
      form.resetFields();
      loadLabs();
    } catch {
      message.error(editMode ? '랩 수정에 실패했습니다.' : '랩 등록에 실패했습니다.');
    }
  };

  const handleEdit = (lab: Lab) => {
    setEditMode(true);
    setCurrentLab(lab);
    setModalOpen(true);
    form.setFieldsValue({
      code: lab.code,
      name: lab.name,
      description: lab.description,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLab(id);
      message.success('랩이 삭제되었습니다.');
      loadLabs();
    } catch {
      message.error('랩 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>랩 관리</h2>
      <Button type="primary" onClick={() => { setModalOpen(true); setEditMode(false); setCurrentLab(null); form.resetFields(); }} style={{ marginBottom: 16 }}>
        랩 추가
      </Button>
      <Table
        dataSource={labs}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '코드', dataIndex: 'code', key: 'code' },
          { title: '이름', dataIndex: 'name', key: 'name' },
          { title: '설명', dataIndex: 'description', key: 'description' },
          { title: '생성일', dataIndex: 'created_at', key: 'created_at' },
          {
            title: '관리',
            key: 'action',
            render: (_, record: Lab) => (
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
        title={editMode ? '랩 수정' : '랩 추가'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditMode(false); setCurrentLab(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddLab}>
          <Form.Item name="code" label="랩 코드" rules={[{ required: true, message: '코드를 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="name" label="랩 이름" rules={[{ required: true, message: '이름을 입력하세요.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Labs; 