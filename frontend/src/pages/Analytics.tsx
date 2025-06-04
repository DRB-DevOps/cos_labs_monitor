import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Spin, message, Typography } from 'antd';
import Plot from 'react-plotly.js';
import { fetchLabs, fetchLabConnections, fetchProjects, fetchActivities, fetchCosts } from '../services/api';
import { Lab } from '../types/lab';
import { Project } from '../types/project';
import { Activity } from '../types/activity';
import { Cost } from '../types/cost';
import { LabConnection } from '../types/analytics';
import dayjs, { Dayjs } from 'dayjs';
import CytoscapeNetwork from '../components/CytoscapeNetwork';
import isoWeek from 'dayjs/plugin/isoWeek';

const { RangePicker } = DatePicker;

dayjs.extend(isoWeek);

const Analytics: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const [connections, setConnections] = useState<LabConnection[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(1, 'month'),
    dayjs()
  ]);
  const [drillData, setDrillData] = useState<{dates: string[], hours: number[], costs: number[], participants: number[]}>();
  const [drillLoading, setDrillLoading] = useState(false);
  const [aggregation, setAggregation] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // aggregation 단위별로 날짜 key를 만드는 함수
  function getDateKey(date: dayjs.Dayjs) {
    if (aggregation === 'day') return date.format('YYYY-MM-DD');
    if (aggregation === 'week') return date.format('YYYY-[W]WW');
    if (aggregation === 'month') return date.format('YYYY-MM');
    if (aggregation === 'year') return date.format('YYYY');
    return date.format('YYYY-MM-DD');
  }

  // 데이터 로드 함수 (활동/비용 전체 불러오기)
  const loadData = async () => {
    setLoading(true);
    try {
      const [labs, projects, acts, csts] = await Promise.all([
        fetchLabs(), fetchProjects(), fetchActivities(), fetchCosts()
      ]);
      setLabs(labs);
      setProjects(projects);
      setActivities(acts);
      setCosts(csts);
      const conns = await fetchLabConnections();
      setConnections(conns);
      const supportActs = acts.filter(a => a.activity_type === 'support' && a.supported_lab_name);
      console.log('지원관계 활동 수:', supportActs.length, supportActs);
    } catch {
      message.error('분석 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [projectId, dateRange, selectedLabId]);

  // aggregation(집계 단위)에 따라 기간 내 날짜 key 목록 생성
  function getDateKeysInRange(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const keys: string[] = [];
    let d = start.startOf(aggregation);
    while (d.isBefore(end) || d.isSame(end, aggregation)) {
      keys.push(getDateKey(d));
      if (aggregation === 'day') d = d.add(1, 'day');
      else if (aggregation === 'week') d = d.add(1, 'week');
      else if (aggregation === 'month') d = d.add(1, 'month');
      else if (aggregation === 'year') d = d.add(1, 'year');
      else d = d.add(1, 'day');
      if (d.isAfter(end)) break;
    }
    if (keys.length === 0) keys.push(getDateKey(start));
    return keys;
  }

  // aggregation에 따라 활동/비용 데이터를 날짜별로 합산
  function aggregateStatsByDate() {
    if (!dateRange) return { x: [], hours: [], costs: [], participants: [] };
    const [start, end] = dateRange;
    const dateKeys = getDateKeysInRange(start, end);
    const agg: Record<string, { hours: number, costs: number, participants: Set<number> }> = {};
    dateKeys.forEach(k => { agg[k] = { hours: 0, costs: 0, participants: new Set() }; });
    // 활동 집계
    activities.forEach(act => {
      const d = dayjs(act.activity_date);
      if (d.isBefore(start) || d.isAfter(end)) return;
      if (selectedLabId && act.lab_id !== selectedLabId) return;
      if (projectId && act.project_id !== projectId) return;
      const key = getDateKey(d);
      if (agg[key]) {
        agg[key].hours += act.hours;
        agg[key].participants.add(act.personnel_id);
      }
    });
    // 비용 집계
    costs.forEach(cost => {
      const d = dayjs(cost.cost_date);
      if (d.isBefore(start) || d.isAfter(end)) return;
      if (selectedLabId && cost.lab_id !== selectedLabId) return;
      if (projectId && cost.project_id !== projectId) return;
      const key = getDateKey(d);
      if (agg[key]) {
        agg[key].costs += cost.amount;
      }
    });
    // key별 참여자(personnel_id) 배열 로그 출력
    Object.entries(agg).forEach(([k, v]) => {
      console.log('key:', k, '참여자:', Array.from(v.participants));
    });
    return {
      x: dateKeys,
      hours: dateKeys.map(k => agg[k].hours),
      costs: dateKeys.map(k => agg[k].costs),
      participants: dateKeys.map(k => agg[k].participants.size),
    };
  }

  const aggData = aggregateStatsByDate();
  console.log('aggData.x', aggData.x);

  // Cytoscape 네트워크 데이터 변환
  const cyNodes = Array.from(new Set([
    ...connections.map(c => c.supporting_lab),
    ...connections.map(c => c.supported_lab),
  ])).map(lab => ({ data: { id: lab, label: lab } }));
  const cyEdges = connections.map(c => ({
    data: {
      source: c.supporting_lab,
      target: c.supported_lab,
      label: `${c.supporting_lab}→${c.supported_lab} (${Math.round(c.total_hours)}h)` ,
      weight: c.total_hours
    }
  }));

  console.log('connections', connections);
  console.log('cyNodes', cyNodes);
  console.log('cyEdges', cyEdges);

  const nodeIds = new Set(cyNodes.map(n => n.data.id));
  const elements = [
    ...cyNodes.filter(n => n.data && typeof n.data.id === 'string' && n.data.id),
    ...cyEdges.filter(e =>
      e.data &&
      typeof e.data.source === 'string' &&
      typeof e.data.target === 'string' &&
      e.data.source &&
      e.data.target &&
      nodeIds.has(e.data.source) &&
      nodeIds.has(e.data.target)
    )
  ];
  console.log('최종 elements', elements);

  // Cytoscape 스타일
  const cyStyle = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-valign': 'center',
        'color': '#222',
        'background-color': '#1890ff',
        'width': 40,
        'height': 40,
        'font-size': 14,
        'font-weight': 'bold',
      }
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'width': 'mapData(weight, 1, 40, 2, 16)',
        'line-color': '#fa541c',
        'target-arrow-color': '#fa541c',
        'label': 'data(label)',
        'font-size': 12,
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
      }
    }
  ];

  // Bar Chart 클릭 시 drill-down
  const handleBarClick = async (labIdx: number) => {
    // 기존 fetchLabStats 기반 drill-down 로직 주석 처리
    // const lab = labs[labIdx];
    // if (!lab) return;
    // setDrillLoading(true);
    // setSelectedLab(lab.id);
    // // 기간 내에서 일별로 통계 조회
    // const start = dateRange ? dateRange[0] : dayjs().subtract(30, 'day');
    // const end = dateRange ? dateRange[1] : dayjs();
    // const days: string[] = [];
    // for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
    //   days.push(d.format('YYYY-MM-DD'));
    // }
    // const params: any = { project_id: projectId };
    // const hours: number[] = [];
    // const costs: number[] = [];
    // const participants: number[] = [];
    // for (const day of days) {
    //   const stat = await fetchLabStats(lab.id, { ...params, start_date: day, end_date: day });
    //   hours.push(stat.total_hours);
    //   costs.push(stat.total_cost);
    //   participants.push(stat.participant_count);
    // }
    // setDrillData({ dates: days, hours, costs, participants });
    // setDrillLoading(false);
  };

  // Plotly 레이아웃 공통 옵션 생성 함수
  function getPlotLayout(title: string) {
    return {
      width: undefined,
      height: 320,
      title: { text: title },
      xaxis: {
        tickangle: -30,
        automargin: true,
        type: aggregation === 'year' ? 'category' as const : undefined,
      },
      margin: { l: 40, r: 20, t: 40, b: 60 },
    };
  }

  return (
    <div>
      <h2>분석/시각화</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="프로젝트 선택"
            options={[{ label: '전체', value: undefined }, ...projects.map(p => ({ label: p.name, value: p.id }))]}
            value={projectId}
            onChange={v => setProjectId(v)}
          />
        </Col>
        <Col>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="랩 선택"
            options={[{ label: '전체', value: undefined }, ...labs.map(l => ({ label: l.name, value: l.id }))]}
            value={selectedLabId}
            onChange={v => setSelectedLabId(v)}
          />
        </Col>
        <Col>
          <RangePicker
            value={dateRange as any}
            onChange={v => setDateRange(v as [Dayjs, Dayjs] | null)}
            allowClear
          />
        </Col>
        <Col>
          <Select
            style={{ width: 120 }}
            value={aggregation}
            onChange={v => setAggregation(v)}
            options={[
              { label: '일간', value: 'day' },
              { label: '주간', value: 'week' },
              { label: '월간', value: 'month' },
              { label: '연간', value: 'year' },
            ]}
          />
        </Col>
      </Row>
      {loading ? <Spin size="large" /> : (
        <>
          {(!dateRange || !dateRange[0] || !dateRange[1]) ? (
            <Typography.Text type="warning">기간을 선택해주세요.</Typography.Text>
          ) : (
            <>
              <Row gutter={0} style={{ flexDirection: 'column' }}>
                <Col xs={24}>
                  <Card title={`투입시간 (${aggregation === 'day' ? '일간' : aggregation === 'week' ? '주간' : aggregation === 'month' ? '월간' : '연간'})`} style={{ marginBottom: 24 }}>
                    <div style={{ width: '100%', minHeight: 320 }}>
                      <Plot
                        data={[{
                          type: 'bar',
                          x: aggData.x,
                          y: aggData.hours,
                          marker: { color: '#1890ff' },
                        }]}
                        layout={getPlotLayout('투입시간(시간)')}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                      <Typography.Text type="secondary">* X축 단위를 변경할 수 있습니다.</Typography.Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card title={`비용 (${aggregation === 'day' ? '일간' : aggregation === 'week' ? '주간' : aggregation === 'month' ? '월간' : '연간'})`} style={{ marginBottom: 24 }}>
                    <div style={{ width: '100%', minHeight: 320 }}>
                      <Plot
                        data={[{
                          type: 'bar',
                          x: aggData.x,
                          y: aggData.costs,
                          marker: { color: '#52c41a' },
                        }]}
                        layout={getPlotLayout('비용(원)')}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card title={`참여 인원수 (${aggregation === 'day' ? '일간' : aggregation === 'week' ? '주간' : aggregation === 'month' ? '월간' : '연간'})`} style={{ marginBottom: 24 }}>
                    <div style={{ width: '100%', minHeight: 320 }}>
                      <Plot
                        data={[{
                          type: 'bar',
                          x: aggData.x,
                          y: aggData.participants,
                          marker: { color: '#faad14' },
                        }]}
                        layout={getPlotLayout('참여 인원수')}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}
          <Row gutter={24} style={{ marginTop: 32 }}>
            <Col xs={24}>
              <Card title="랩간 지원관계 네트워크">
                <div style={{ width: '100%', height: 500 }}>
                  <CytoscapeNetwork
                    elements={elements}
                    style={{ width: '100%', height: '100%' }}
                    layout={{ name: 'cose', animate: true }}
                    stylesheet={cyStyle as any}
                  />
                </div>
              </Card>
            </Col>
          </Row>
          {selectedLab && drillData && (
            <Row gutter={24} style={{ marginTop: 32 }}>
              <Col xs={24}>
                <Card title={`[${labs.find(l => l.id === selectedLab)?.name}] 상세 추이 (일별)`}>
                  {drillLoading ? <Spin /> : (
                    <Plot
                      data={[
                        { x: drillData.dates, y: drillData.hours, type: 'scatter', mode: 'lines+markers', name: '투입시간(시간)', line: { color: '#1890ff' } },
                        { x: drillData.dates, y: drillData.costs, type: 'scatter', mode: 'lines+markers', name: '비용(원)', yaxis: 'y2', line: { color: '#52c41a' } },
                        { x: drillData.dates, y: drillData.participants, type: 'scatter', mode: 'lines+markers', name: '참여 인원수', yaxis: 'y3', line: { color: '#faad14' } },
                      ]}
                      layout={{
                        height: 400,
                        title: { text: '일별 상세 추이' },
                        yaxis: { title: { text: '투입시간(시간)' }, side: 'left' },
                        yaxis2: { title: { text: '비용(원)' }, overlaying: 'y', side: 'right', showgrid: false },
                        yaxis3: { title: { text: '참여 인원수' }, overlaying: 'y', side: 'right', position: 1, anchor: 'x', showgrid: false },
                        legend: { x: 0, y: 1.1, orientation: 'h' },
                      }}
                      config={{ displayModeBar: false }}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics; 