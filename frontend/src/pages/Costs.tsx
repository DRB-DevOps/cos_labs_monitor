import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Popconfirm, Space } from 'antd';
import { fetchCosts, createCost, updateCost, deleteCost, fetchLabs, fetchProjects } from '../services/api';
import { Cost, CostInput } from '../types/cost';
import { Lab } from '../types/lab';
import { Project } from '../types/project';
import dayjs from 'dayjs';

const costTypeOptions = [
  { label: '실제 집행', value: 'actual' },
  { label: '예산', value: 'budget' },
];

const categoryOptions = [
  { label: '인건비', value: '인건비' },
  { label: '장비비', value: '장비비' },
  { label: '재료비', value: '재료비' },
  { label: '기타', value: '기타' },
];

const Costs: React.FC = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCost, setCurrentCost] = useState<Cost | null>(null);
  const [form] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [costs, labs, projects] = await Promise.all([
        fetchCosts(), fetchLabs(), fetchProjects()
      ]);
      setCosts(costs);
      setLabs(labs);
      setProjects(projects);
    } catch {
      message.error('비용 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddCost = async (values: any) => {
    const payload: CostInput = {
      ...values,
      amount: Number(values.amount),
      cost_date: values.cost_date.format('YYYY-MM-DD'),
    };
    try {
      if (editMode && currentCost) {
        await updateCost(currentCost.id, payload);
        message.success('비용이 수정되었습니다.');
      } else {
        await createCost(payload);
        message.success('비용이 등록되었습니다.');
      }
      setModalOpen(false);
      setEditMode(false);
      setCurrentCost(null);
      form.resetFields();
      loadAll();
    } catch {
      message.error(editMode ? '비용 수정에 실패했습니다.' : '비용 등록에 실패했습니다.');
    }
  };

  const handleEdit = (cost: Cost) => {
    setEditMode(true);
    setCurrentCost(cost);
    setModalOpen(true);
    form.setFieldsValue({
      lab_id: cost.lab_id,
      project_id: cost.project_id,
      cost_date: dayjs(cost.cost_date),
      amount: cost.amount,
      cost_type: cost.cost_type,
      category: cost.category,
      description: cost.description,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCost(id);
      message.success('비용이 삭제되었습니다.');
      loadAll();
    } catch {
      message.error('비용 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>비용 관리</h2>
      <Button type="primary" onClick={() => { setModalOpen(true); setEditMode(false); setCurrentCost(null); form.resetFields(); }} style={{ marginBottom: 16 }}>
        비용 추가
      </Button>
      <Table
        dataSource={costs}
        rowKey="id"
        loading={loading}
        columns={[
          { title: '일자', dataIndex: 'cost_date', key: 'cost_date' },
          { title: '랩', dataIndex: 'lab_id', key: 'lab_id', render: (id: number) => labs.find(l => l.id === id)?.name },
          { title: '프로젝트', dataIndex: 'project_id', key: 'project_id', render: (id: number) => projects.find(p => p.id === id)?.name || '미상' },
          { title: '금액', dataIndex: 'amount', key: 'amount' },
          { title: '유형', dataIndex: 'cost_type', key: 'cost_type', render: (v: string) => v === 'actual' ? '실제' : '예산' },
          { title: '카테고리', dataIndex: 'category', key: 'category' },
          { title: '설명', dataIndex: 'description', key: 'description' },
          {
            title: '관리',
            key: 'action',
            render: (_, record: Cost) => (
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
        title={editMode ? '비용 수정' : '비용 추가'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditMode(false); setCurrentCost(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '등록'}
        cancelText="취소"
      >
        <Form form={form} layout="vertical" onFinish={handleAddCost}>
          <Form.Item name="cost_date" label="일자" rules={[{ required: true, message: '일자를 선택하세요.' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lab_id" label="랩" rules={[{ required: true, message: '랩을 선택하세요.' }]}> 
            <Select options={labs.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="project_id" label="프로젝트">
            <Select options={[{ label: '미상', value: undefined }, ...projects.map(p => ({ label: p.name, value: p.id }))]} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="amount" label="금액" rules={[{ required: true, message: '금액을 입력하세요.' }]}> 
            <InputNumber min={0} step={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cost_type" label="유형" initialValue="actual" rules={[{ required: true }]}> 
            <Select options={costTypeOptions} />
          </Form.Item>
          <Form.Item name="category" label="카테고리">
            <Select options={categoryOptions} allowClear />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Costs; 