from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Enum, Numeric
import enum

db = SQLAlchemy()

class ActivityType(enum.Enum):
    OWN = "own"          # 자체 랩 활동
    SUPPORT = "support"  # 다른 랩 지원 활동

class ProjectStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    UNKNOWN = "unknown"  # 미상 상태

class CostType(enum.Enum):
    ACTUAL = "actual"     # 실제 비용
    BUDGET = "budget"     # 예산성 비용

# 랩 정보
class Lab(db.Model):
    __tablename__ = 'labs'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)  # 랩 고유 코드
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # 관계
    activities = db.relationship(
        'Activity',
        backref='lab',
        lazy=True,
        foreign_keys='Activity.lab_id'  # 명확히 지정
    )
    costs = db.relationship(
        'Cost',
        backref='lab',
        lazy=True,
        foreign_keys='Cost.lab_id'  # 명확히 지정
    )

# 프로젝트 정보
project_labs = db.Table(
    'project_labs',
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id'), primary_key=True),
    db.Column('lab_id', db.Integer, db.ForeignKey('labs.id'), primary_key=True)
)

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # 주도 랩
    lead_lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    lead_lab = db.relationship('Lab', foreign_keys=[lead_lab_id])
    # 참여/지원 랩 N:M
    labs = db.relationship('Lab', secondary=project_labs, backref='projects')
    
    # 관계
    activities = db.relationship('Activity', backref='project', lazy=True)
    costs = db.relationship('Cost', backref='project', lazy=True)

# 인적자원 정보
personnel_labs = db.Table(
    'personnel_labs',
    db.Column('personnel_id', db.Integer, db.ForeignKey('personnel.id'), primary_key=True),
    db.Column('lab_id', db.Integer, db.ForeignKey('labs.id'), primary_key=True)
)

class Personnel(db.Model):
    __tablename__ = 'personnel'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    ms_teams_id = db.Column(db.String(100))  # MS Teams 연동용
    position = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 관계
    activities = db.relationship('Activity', backref='personnel', lazy=True)
    labs = db.relationship('Lab', secondary=personnel_labs, backref='personnel')

# 일자별 랩활동 데이터
class Activity(db.Model):
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    personnel_id = db.Column(db.Integer, db.ForeignKey('personnel.id'), nullable=False)
    lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))  # NULL 가능 (미상)
    
    activity_date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, nullable=False)  # 투입 시간
    activity_type = db.Column(Enum(ActivityType), default=ActivityType.OWN)
    
    # 지원 활동인 경우 지원받는 랩
    supported_lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'))
    
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계
    supported_lab = db.relationship('Lab', foreign_keys=[supported_lab_id])

# 비용 데이터
class Cost(db.Model):
    __tablename__ = 'costs'
    
    id = db.Column(db.Integer, primary_key=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))  # NULL 가능 (미상)
    
    cost_date = db.Column(db.Date, nullable=False)
    amount = db.Column(Numeric(15, 2), nullable=False)
    cost_type = db.Column(Enum(CostType), nullable=False)
    category = db.Column(db.String(50))  # 비용 카테고리 (인건비, 장비비, 기타 등)
    description = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 랩간 지원 관계 매트릭스 (분석용)
class LabSupportRelation(db.Model):
    __tablename__ = 'lab_support_relations'
    
    id = db.Column(db.Integer, primary_key=True)
    supporting_lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    supported_lab_id = db.Column(db.Integer, db.ForeignKey('labs.id'), nullable=False)
    total_hours = db.Column(db.Float, default=0.0)
    last_activity_date = db.Column(db.Date)
    
    # 관계
    supporting_lab = db.relationship('Lab', foreign_keys=[supporting_lab_id])
    supported_lab = db.relationship('Lab', foreign_keys=[supported_lab_id])
    
    # 유니크 제약조건
    __table_args__ = (db.UniqueConstraint('supporting_lab_id', 'supported_lab_id'),) 