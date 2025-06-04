# Future Labs 트래킹 시스템

## 개요
회사내 Future Labs 활동에 투입되는 인적자원, 시간, 비용에 대한 입체적 분석 및 트래킹 시스템

## 주요 기능
- 일자별 랩활동 시간 트래킹
- 랩간 지원활동 관계 추적
- 프로젝트별 리소스 매핑
- 비용 및 예산 관리
- 시각화 대시보드

## 기술 스택
- Backend: Python Flask + SQLAlchemy
- Database: SQLite
- Frontend: HTML/CSS/JavaScript + Plotly.js
- 향후 배포: AWS (EC2 + RDS)

## 설치 및 실행

### 로컬 개발 환경 설정
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 초기화
python init_db.py

# 애플리케이션 실행
python app.py
```

애플리케이션은 http://localhost:5000 에서 실행됩니다.

## 데이터베이스 구조
- **Labs**: 랩 정보 및 고유 코드
- **Projects**: 프로젝트 정보
- **Personnel**: 인적자원 및 MS 계정 정보
- **Activities**: 일자별 랩활동 데이터
- **Costs**: 비용 및 예산 데이터
- **Lab_Support_Relations**: 랩간 지원활동 관계 