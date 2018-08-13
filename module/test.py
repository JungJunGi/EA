
import time
import datetime
import os
import schedule
import savedata_scheduling



def job():
    print("I'm working...")

    today = time.localtime(time.time())

    year = str(today.tm_year)
    month = str(today.tm_mon)
    day = str(today.tm_mday)
    hour = str(today.tm_hour)
    min = str(today.tm_min)
    sec = str(today.tm_sec)

    if month.__len__()<2:
        month = "0" + month

    date = year + month + day + '_' + hour + ';' + min + ';' + sec

    filename = 'C:\\Users\\DS\\Documents\\test\\'+ date +'.txt'
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    f = open(filename, 'wt')
    f.write(date)
  


# 10초에 한번씩 실행
schedule.every(10).seconds.do(job)
# 10분에 한번씩 실행
schedule.every(1).minutes.do(job)
# 매 시간 실행
# schedule.every().hour.do(job)
# 매일 14:30 에 실행
schedule.every().day.at("15:54").do(job)
# 매주 월요일 실행
# schedule.every().monday.do(job)
# 매주 수요일 13:15 에 실행
# schedule.every().wednesday.at("13:15").do(job)

while True:
    schedule.run_pending()
    time.sleep(1)  # 1초마다 실행
 
