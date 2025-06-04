from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import db, Lab, Project, Personnel, Activity, Cost, LabSupportRelation
from models import ActivityType, ProjectStatus, CostType
from datetime import datetime, date
import os
from sqlalchemy import func, and_, or_
from decimal import Decimal

app = Flask(__name__, static_folder="frontend/build")

# 데이터베이스 설정
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "future_labs.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# CORS 설정 (React 앱과 통신)
CORS(app, origins=['http://localhost:3000'])

# 데이터베이스 초기화
db.init_app(app)

# JSON Encoder 커스터마이징 (날짜, Decimal 처리)
class CustomJSONEncoder:
    @staticmethod
    def default(obj):
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

app.json_encoder = CustomJSONEncoder

# API 라우트들

# 대시보드 데이터
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        # 전체 랩 수
        total_labs = Lab.query.filter_by(is_active=True).count()
        
        # 전체 프로젝트 수
        total_projects = Project.query.count()
        
        # 총 투입 시간 (최근 30일)
        from datetime import timedelta
        thirty_days_ago = date.today() - timedelta(days=30)
        total_hours = db.session.query(func.sum(Activity.hours)).filter(
            Activity.activity_date >= thirty_days_ago
        ).scalar() or 0
        
        # 활성 인원 수
        active_personnel = Personnel.query.filter_by(is_active=True).count()
        
        # 총 비용 (최근 30일)
        total_cost = db.session.query(func.sum(Cost.amount)).filter(
            and_(Cost.cost_date >= thirty_days_ago, Cost.cost_type == CostType.ACTUAL)
        ).scalar() or 0
        
        return jsonify({
            'total_labs': total_labs,
            'total_projects': total_projects,
            'total_hours': float(total_hours),
            'active_personnel': active_personnel,
            'total_cost': float(total_cost)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 랩 관련 API
@app.route('/api/labs', methods=['GET'])
def get_labs():
    try:
        labs = Lab.query.filter_by(is_active=True).all()
        return jsonify([{
            'id': lab.id,
            'code': lab.code,
            'name': lab.name,
            'description': lab.description,
            'created_at': lab.created_at,
            'is_active': lab.is_active
        } for lab in labs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs', methods=['POST'])
def create_lab():
    try:
        data = request.get_json()
        lab = Lab(
            code=data['code'],
            name=data['name'],
            description=data.get('description', '')
        )
        db.session.add(lab)
        db.session.commit()
        return jsonify({'message': '랩이 성공적으로 생성되었습니다.', 'id': lab.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs/<int:lab_id>', methods=['PUT'])
def update_lab(lab_id):
    try:
        data = request.get_json()
        lab = Lab.query.get_or_404(lab_id)
        lab.code = data.get('code', lab.code)
        lab.name = data.get('name', lab.name)
        lab.description = data.get('description', lab.description)
        db.session.commit()
        return jsonify({'message': '랩이 수정되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs/<int:lab_id>', methods=['DELETE'])
def delete_lab(lab_id):
    try:
        lab = Lab.query.get_or_404(lab_id)
        db.session.delete(lab)
        db.session.commit()
        return jsonify({'message': '랩이 삭제되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 프로젝트 관련 API
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        projects = Project.query.all()
        result = []
        for project in projects:
            result.append({
                'id': project.id,
                'code': project.code,
                'name': project.name,
                'description': project.description,
                'start_date': project.start_date,
                'end_date': project.end_date,
                'status': project.status.value if project.status else None,
                'lead_lab': {'id': project.lead_lab.id, 'name': project.lead_lab.name} if project.lead_lab else None,
                'labs': [{'id': lab.id, 'name': lab.name} for lab in project.labs]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    try:
        data = request.get_json()
        project = Project(
            code=data['code'],
            name=data['name'],
            description=data.get('description', ''),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
            status=ProjectStatus(data.get('status', 'active')),
            lead_lab_id=data['lead_lab_id']
        )
        # 참여랩(N:M)
        if 'lab_ids' in data:
            project.labs = Lab.query.filter(Lab.id.in_(data['lab_ids'])).all()
        db.session.add(project)
        db.session.commit()
        return jsonify({'message': '프로젝트가 성공적으로 생성되었습니다.', 'id': project.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    try:
        data = request.get_json()
        project = Project.query.get_or_404(project_id)
        project.code = data.get('code', project.code)
        project.name = data.get('name', project.name)
        project.description = data.get('description', project.description)
        project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else project.start_date
        project.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else project.end_date
        project.status = ProjectStatus(data.get('status', project.status.value)) if data.get('status') else project.status
        if 'lead_lab_id' in data:
            project.lead_lab_id = data['lead_lab_id']
        if 'lab_ids' in data:
            project.labs = Lab.query.filter(Lab.id.in_(data['lab_ids'])).all()
        db.session.commit()
        return jsonify({'message': '프로젝트가 수정되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    try:
        project = Project.query.get_or_404(project_id)
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': '프로젝트가 삭제되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 인적자원 관련 API
@app.route('/api/personnel', methods=['GET'])
def get_personnel():
    try:
        personnel = Personnel.query.filter_by(is_active=True).all()
        return jsonify([{
            'id': person.id,
            'employee_id': person.employee_id,
            'name': person.name,
            'email': person.email,
            'ms_teams_id': person.ms_teams_id,
            'position': person.position,
            'labs': [{'id': lab.id, 'name': lab.name} for lab in person.labs]
        } for person in personnel])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/personnel', methods=['POST'])
def create_personnel():
    try:
        data = request.get_json()
        person = Personnel(
            employee_id=data['employee_id'],
            name=data['name'],
            email=data['email'],
            ms_teams_id=data.get('ms_teams_id'),
            position=data.get('position')
        )
        if 'lab_ids' in data:
            person.labs = Lab.query.filter(Lab.id.in_(data['lab_ids'])).all()
        db.session.add(person)
        db.session.commit()
        return jsonify({'message': '인적자원이 성공적으로 등록되었습니다.', 'id': person.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/personnel/<int:person_id>', methods=['PUT'])
def update_personnel(person_id):
    try:
        data = request.get_json()
        person = Personnel.query.get_or_404(person_id)
        person.employee_id = data.get('employee_id', person.employee_id)
        person.name = data.get('name', person.name)
        person.email = data.get('email', person.email)
        person.ms_teams_id = data.get('ms_teams_id', person.ms_teams_id)
        person.position = data.get('position', person.position)
        if 'lab_ids' in data:
            person.labs = Lab.query.filter(Lab.id.in_(data['lab_ids'])).all()
        db.session.commit()
        return jsonify({'message': '인적자원이 수정되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 활동 관련 API
@app.route('/api/activities', methods=['GET'])
def get_activities():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        lab_id = request.args.get('lab_id')
        
        query = Activity.query
        
        if start_date:
            query = query.filter(Activity.activity_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Activity.activity_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if lab_id:
            query = query.filter(Activity.lab_id == lab_id)
            
        activities = query.all()
        
        return jsonify([{
            'id': activity.id,
            'personnel_id': activity.personnel_id,
            'lab_id': activity.lab_id,
            'project_id': activity.project_id,
            'personnel_name': activity.personnel.name,
            'lab_name': activity.lab.name,
            'project_name': activity.project.name if activity.project else '미상',
            'activity_date': activity.activity_date,
            'hours': float(activity.hours),
            'activity_type': activity.activity_type.value,
            'supported_lab_name': activity.supported_lab.name if activity.supported_lab else None,
            'description': activity.description
        } for activity in activities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/activities', methods=['POST'])
def create_activity():
    try:
        data = request.get_json()
        activity = Activity(
            personnel_id=data['personnel_id'],
            lab_id=data['lab_id'],
            project_id=data.get('project_id'),
            activity_date=datetime.strptime(data['activity_date'], '%Y-%m-%d').date(),
            hours=float(data['hours']),
            activity_type=ActivityType(data.get('activity_type', 'own')),
            supported_lab_id=data.get('supported_lab_id'),
            description=data.get('description', '')
        )
        db.session.add(activity)
        
        # 지원 관계 업데이트
        if activity.activity_type == ActivityType.SUPPORT and activity.supported_lab_id:
            relation = LabSupportRelation.query.filter_by(
                supporting_lab_id=activity.lab_id,
                supported_lab_id=activity.supported_lab_id
            ).first()
            
            if relation:
                relation.total_hours += activity.hours
                relation.last_activity_date = activity.activity_date
            else:
                relation = LabSupportRelation(
                    supporting_lab_id=activity.lab_id,
                    supported_lab_id=activity.supported_lab_id,
                    total_hours=activity.hours,
                    last_activity_date=activity.activity_date
                )
                db.session.add(relation)
        
        db.session.commit()
        return jsonify({'message': '활동이 성공적으로 등록되었습니다.', 'id': activity.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# 랩별 통계 API (프로젝트/기간 필터 지원)
@app.route('/api/labs/<int:lab_id>/stats', methods=['GET'])
def get_lab_stats(lab_id):
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        project_id = request.args.get('project_id')
        
        # 기본 통계
        query = Activity.query.filter_by(lab_id=lab_id)
        if start_date:
            query = query.filter(Activity.activity_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Activity.activity_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if project_id:
            query = query.filter(Activity.project_id == int(project_id))
        
        total_hours = db.session.query(func.sum(Activity.hours)).filter_by(lab_id=lab_id)
        if start_date:
            total_hours = total_hours.filter(Activity.activity_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            total_hours = total_hours.filter(Activity.activity_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if project_id:
            total_hours = total_hours.filter(Activity.project_id == int(project_id))
        total_hours = total_hours.scalar() or 0
        
        participant_count = query.distinct(Activity.personnel_id).count()
        
        # 비용 통계
        cost_query = Cost.query.filter_by(lab_id=lab_id)
        if start_date:
            cost_query = cost_query.filter(Cost.cost_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            cost_query = cost_query.filter(Cost.cost_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if project_id:
            cost_query = cost_query.filter(Cost.project_id == int(project_id))
        total_cost = db.session.query(func.sum(Cost.amount)).filter_by(lab_id=lab_id)
        if start_date:
            total_cost = total_cost.filter(Cost.cost_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            total_cost = total_cost.filter(Cost.cost_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if project_id:
            total_cost = total_cost.filter(Cost.project_id == int(project_id))
        total_cost = total_cost.scalar() or 0
        
        return jsonify({
            'total_hours': float(total_hours),
            'participant_count': participant_count,
            'total_cost': float(total_cost)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 랩간 연결성 데이터 API (기간/프로젝트 필터 지원)
@app.route('/api/lab-connections', methods=['GET'])
def get_lab_connections():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        project_id = request.args.get('project_id')
        
        query = db.session.query(
            Activity.lab_id.label('supporting_lab_id'),
            Activity.supported_lab_id.label('supported_lab_id'),
            func.sum(Activity.hours).label('total_hours'),
            func.max(Activity.activity_date).label('last_activity_date')
        ).filter(
            func.upper(Activity.activity_type) == 'SUPPORT',
            Activity.supported_lab_id.isnot(None)
        )
        if start_date:
            query = query.filter(Activity.activity_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Activity.activity_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if project_id:
            query = query.filter(Activity.project_id == int(project_id))
        query = query.group_by(Activity.lab_id, Activity.supported_lab_id)
        
        results = query.all()
        print('lab-connections 쿼리 결과:', results)
        
        # 랩명 매핑
        lab_map = {lab.id: lab.name for lab in Lab.query.all()}
        
        data = []
        for row in results:
            if row.supported_lab_id is None:
                continue
            data.append({
                'supporting_lab': lab_map.get(row.supporting_lab_id, 'Unknown'),
                'supported_lab': lab_map.get(row.supported_lab_id, 'Unknown'),
                'total_hours': float(row.total_hours),
                'last_activity_date': row.last_activity_date
            })
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/costs', methods=['GET'])
def get_costs():
    try:
        lab_id = request.args.get('lab_id')
        project_id = request.args.get('project_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = Cost.query
        if lab_id:
            query = query.filter(Cost.lab_id == lab_id)
        if project_id:
            query = query.filter(Cost.project_id == project_id)
        if start_date:
            query = query.filter(Cost.cost_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Cost.cost_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

        costs = query.all()
        result = []
        for cost in costs:
            result.append({
                'id': cost.id,
                'lab_id': cost.lab_id,
                'project_id': cost.project_id,
                'cost_date': cost.cost_date.isoformat(),
                'amount': float(cost.amount),
                'cost_type': cost.cost_type.value,
                'category': cost.category,
                'description': cost.description,
                'created_at': cost.created_at.isoformat() if cost.created_at else None,
                'updated_at': cost.updated_at.isoformat() if cost.updated_at else None,
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 
