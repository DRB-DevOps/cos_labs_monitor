from app import app, db
from models import Lab, Project, Personnel, Activity, Cost, ActivityType, ProjectStatus, CostType
from datetime import datetime, date, timedelta
import random

def init_database():
    """데이터베이스 초기화 및 샘플 데이터 생성"""
    with app.app_context():
        # 테이블 삭제 후 재생성
        db.drop_all()
        db.create_all()
        
        print("데이터베이스 테이블 생성 완료...")
        
        # 샘플 랩 데이터
        labs = [
            Lab(code='AFL', name='AFL', description='AFL 랩'),
            Lab(code='ITER', name='아이테르', description='아이테르 랩'),
            Lab(code='SALES', name='Sales Lab', description='Sales Lab'),
            Lab(code='ROBOFOOT', name='Robofoot', description='Robofoot 랩'),
            Lab(code='CSL', name='CSL', description='CSL 랩'),
            Lab(code='TACTILE', name='촉각센서', description='촉각센서 랩'),
            Lab(code='C2B', name='C2B', description='C2B 랩'),
            Lab(code='FOLD', name='폴딩모듈', description='폴딩모듈 랩'),
            Lab(code='RDS', name='RDS', description='RDS 랩'),
            Lab(code='MINIFARM', name='MiniFarm', description='MiniFarm 랩'),
            Lab(code='DANDELION', name='Dandelion', description='Dandelion 랩'),
            Lab(code='CONSUMER', name='Consumer Lab', description='Consumer Lab'),
        ]
        
        for lab in labs:
            db.session.add(lab)
        
        db.session.commit()  # 랩 먼저 커밋하여 id 할당
        
        # 샘플 프로젝트 데이터
        projects = [
            Project(code='PRJ001', name='스마트 팩토리 AI', description='제조업 AI 솔루션', 
                   start_date=date(2024, 1, 1), end_date=date(2024, 12, 31), status=ProjectStatus.ACTIVE, lead_lab_id=labs[0].id),
            Project(code='PRJ002', name='공급망 블록체인', description='공급망 투명성 블록체인', 
                   start_date=date(2024, 2, 1), end_date=date(2024, 11, 30), status=ProjectStatus.ACTIVE, lead_lab_id=labs[1].id),
            Project(code='PRJ003', name='스마트 빌딩 IoT', description='빌딩 관리 IoT 시스템', 
                   start_date=date(2024, 3, 1), end_date=date(2024, 10, 31), status=ProjectStatus.ACTIVE, lead_lab_id=labs[2].id),
            Project(code='UNKNOWN', name='미상', description='미분류 프로젝트', status=ProjectStatus.UNKNOWN, lead_lab_id=labs[0].id)
        ]
        
        for i, project in enumerate(projects):
            # 각 프로젝트에 참여/지원 랩 샘플 지정 (주도랩 + 2개 추가)
            project.labs = [labs[i % len(labs)], labs[(i+1) % len(labs)], labs[(i+2) % len(labs)]]
            db.session.add(project)
        
        # 샘플 인적자원 데이터
        personnel = [
            Personnel(employee_id='EMP001', name='김철수', email='kim.cs@company.com', 
                     ms_teams_id='kim.cs@company.com', position='연구원'),
            Personnel(employee_id='EMP002', name='이영희', email='lee.yh@company.com', 
                     ms_teams_id='lee.yh@company.com', position='선임연구원'),
            Personnel(employee_id='EMP003', name='박민수', email='park.ms@company.com', 
                     ms_teams_id='park.ms@company.com', position='연구원'),
            Personnel(employee_id='EMP004', name='정수진', email='jung.sj@company.com', 
                     ms_teams_id='jung.sj@company.com', position='책임연구원'),
            Personnel(employee_id='EMP005', name='최영수', email='choi.ys@company.com', 
                     ms_teams_id='choi.ys@company.com', position='연구원'),
        ]
        
        for i, person in enumerate(personnel):
            # 각 인적자원에 2~3개 랩을 랜덤 소속
            person.labs = [labs[i % len(labs)], labs[(i+1) % len(labs)], labs[(i+2) % len(labs)]]
            db.session.add(person)
        
        db.session.commit()
        print("기본 데이터 생성 완료...")
        
        # 샘플 활동 데이터 생성 (최근 90일)
        start_date = date.today() - timedelta(days=90)
        
        for i in range(200):  # 200개의 샘플 활동
            activity_date = start_date + timedelta(days=random.randint(0, 89))
            
            # 랜덤 선택
            person_id = random.randint(1, 5)
            lab_id = random.randint(1, 5)
            project_id = random.choice([1, 2, 3, 4, None])  # 일부는 미상
            hours = round(random.uniform(1.0, 8.0), 1)
            activity_type = random.choice([ActivityType.OWN, ActivityType.SUPPORT])
            
            # 지원 활동인 경우 다른 랩 선택
            supported_lab_id = None
            if activity_type == ActivityType.SUPPORT:
                supported_labs = [x for x in range(1, 6) if x != lab_id]
                supported_lab_id = random.choice(supported_labs)
            
            activity = Activity(
                personnel_id=person_id,
                lab_id=lab_id,
                project_id=project_id,
                activity_date=activity_date,
                hours=hours,
                activity_type=activity_type,
                supported_lab_id=supported_lab_id,
                description=f'샘플 활동 데이터 {i+1}'
            )
            
            db.session.add(activity)
        
        # 샘플 비용 데이터 생성
        for i in range(50):  # 50개의 샘플 비용
            cost_date = start_date + timedelta(days=random.randint(0, 89))
            lab_id = random.randint(1, 5)
            project_id = random.choice([1, 2, 3, None])
            amount = round(random.uniform(100000, 5000000), 2)
            cost_type = random.choice([CostType.ACTUAL, CostType.BUDGET])
            category = random.choice(['인건비', '장비비', '재료비', '기타'])
            
            cost = Cost(
                lab_id=lab_id,
                project_id=project_id,
                cost_date=cost_date,
                amount=amount,
                cost_type=cost_type,
                category=category,
                description=f'샘플 비용 데이터 {i+1}'
            )
            
            db.session.add(cost)
        
        db.session.commit()
        print("샘플 데이터 생성 완료!")
        print("총 랩 수:", Lab.query.count())
        print("총 프로젝트 수:", Project.query.count())
        print("총 인적자원 수:", Personnel.query.count())
        print("총 활동 수:", Activity.query.count())
        print("총 비용 데이터 수:", Cost.query.count())

if __name__ == '__main__':
    init_database() 