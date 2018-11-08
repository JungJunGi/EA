![EA](./public/images/workflow.jpeg)

# EA (Energy Assistant)

실시간 에너지 모니터링이 가능한 웹 페이지 입니다.

> 덕성여자대학교 2018 IT미디어공학과 졸업작품 

## 정전기 팀
[Kim Ji Yeon](https://www.github.com/jiyeonkim7) & [Kim Min Joo](https://www.github.com/minjooda) & [Kim Ji Eun](https://www.github.com/sliveryy)

--

# 기획 의도

소규모 공장과 상업용 빌딩 고객의 EMS의 실효성 대비 가격 저항이 매우 큽니다. 따라서 L-EMS(Light - Energy Management Service)를 각 기기에 부착해 기기별, 부서별로 전력량을 보여줌으로써 효율적인 전력 소비를 돕습니다.
전기 요금은 계약전력에 의해 계산되고 계약전력은 일 년 동안 순간 최대 전력을 기준으로 결정됩다. 텍스트는 Big Data를 일일이 비교하기 어렵기 때문에 원하는 정보를 쉽게 파악할 수 있는 정보 시각화를 사용했습니다. 그래프를 통해 최대 전력을 한눈에 찾아내어 결과적으로 계약 전력을 낮춤으로써 요금을 줄일 수 있습니다.

# 작품 소개
실시간 에너지 사용량 모니터링이 가능한 웹 페이지입니다.
공개 DB에서 크롤링한 데이터를 json 형태로 가공하여 mongoDB에 저장합니다. 저장된 데이터를 기반으로 javascript 라이브러리인 D3.js를 사용하여 총 7개의 차트를 제작했습니다.
클라이언트에서 서버에 데이터를 요청했을 때 만약 데이터가 변경되면 웹 브라우저는 변경된 요소를 반영해서 차트를 다시 그리게 됩니다.

# 작품 설명

* 금일 데이터 그래프 (donut chart) / 전기요금 그래프 (line chart)

* 역률 그래프 (step line chart)

* 전력 사용량 그래프 (bar chart + stacked area chart)

* 요일/시간별 전력 소비 패턴 그래프 (heatmap chart + bubble chart)

