
### 매일 23시 59분에 해당날짜 데이터를 몽고디비에 !! ###
### 김지연 ###

from sshtunnel import SSHTunnelForwarder
import pymongo
import time
import sys
import os
import pymysql
import json
import datetime
import schedule



def job():

    print("## Start !! ##")
    print("##", datetime.datetime.today(), "##")


    ### Ready for data ###
    group_companyId = [] 
    group_companyName = []
    group_companyDepart=[]

    comNameDict = {}
    companyDict = {}
    dsitemDict ={}

    row = []

    companyNum = 0
    departNum = 0
    itemNum = 0
    dataNum = 0

    dsitemD = {}
    docD = {}
    metaD = {}
    dd = {}



    ### Today is ... ###
    curtime = time.localtime(time.time())

    year = str(curtime.tm_year)
    month = str(curtime.tm_mon)
    mday = str(curtime.tm_mday)

    if month.__len__()<2:
        month = "0" + month
    if mday.__len__()<2:
        mday = "0" + mday

    date = year + month
    today = year + "-" + month + "-" + mday
    # date = "201810"
    # today = "2018-10-10"
    print("today is ", today)


    ### Ready for mariadb connect ###
    maria_info_file = open('./config/maria.json').read()
    maria_info = json.loads(maria_info_file)

    db = pymysql.connect(
                            host = maria_info['host'],
                            user = maria_info['user'],
                            passwd = maria_info['passwd'],
                            db = maria_info['db'],
                            port = maria_info['port'],
                            charset = maria_info['charset']
                        )

    cursor = db.cursor()

    ### Read COMPANY id & name ###
    sql = "SELECT COMPANY_ID, COMPANY_NAME  FROM INFO_COMPANY"
    companyNum = cursor.execute(sql)
    row = [item for item in cursor.fetchall()]
    group_companyId, group_companyName = zip(*row)
    comNameDict = dict(zip(group_companyId, group_companyName))

    ### Read DEPART info ###
    for i in range(0, companyNum):
        sql = "SELECT FromDSID, FromDISTBDID, DSNAME  FROM INFO_DS125_WebVersion  WHERE COMPANY_ID = %s AND FromDSID IS NOT NULL"
        departNum = cursor.execute(sql, (group_companyId[i]))
        row = [item for item in cursor.fetchall()]
        group_companyDepart.append(list(row))
    companyDict = dict(zip(group_companyId, group_companyDepart))

    ### Read DSITEM id & name ###
    sql = "SELECT DSITEMID, DSITEMNAMEENG  FROM INFO_DS125_ITEM  ORDER BY DSITEMID"
    itemNum = cursor.execute(sql)
    row = [item for item in cursor.fetchall()]
    group_dsitemId, group_dsitemName = zip(*row)
    dsitemDict = dict(zip(group_dsitemId, group_dsitemName))



    client = pymongo.MongoClient('127.0.0.1', server.local_bind_port)
    db = client[MONGO_DB]

    for com in companyDict.keys():

        MONGO_COLLECTION = comNameDict.get(com)
        collection = db[MONGO_COLLECTION]
        print(MONGO_COLLECTION)

        for dept in companyDict.get(com):
            for item in dsitemDict.keys():
                sql = """
                SELECT MDATETIME, DSITEMVAL  FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B 
                WHERE A.DSID = B.FromDSID    AND A.DISTBDID = B.FromDISTBDID 
                AND A.DSID = %s   AND A.DISTBDID = %s   AND DSITEMID = %s   AND DATE_FORMAT(MDATETIME, %s) = %s
                """
                dataNum = cursor.execute(sql, (int(date), dept[0], dept[1], item, "%Y-%m-%d", today))

                # 데이터가 존재하지 않으면 continue
                if dataNum == 0:
                    continue

                metaD["company"] = comNameDict.get(com)
                metaD["year"] = date[:4]
                metaD["month"] = date[4:]
                metaD["item"] = dsitemDict.get(item)
                metaD["depart"] = dept[2]
                docD["meta"] = metaD
                docD["data"] = []

                dd["meta"] = metaD
                d = collection.find_one(dd)

                # 해당 meta data가 존재하지 않으면 생성
                if(not(d)) :
                    collection.insert_one(docD)
                    d = collection.find_one(dd)

                row = [item for item in cursor.fetchall()]
                for r in row:
                    r = list(r)
                    r[0] = str(r[0])
                    r[1] = str(r[1])
                    dsitemD["date"] = r[0]
                    dsitemD["value"] = r[1]
                    collection.update({"_id":d["_id"]}, {"$push":{"data":dsitemD}})
                
                print(docD["meta"])

                # 초기화
                dsitemD = {}
                docD = {}
                metaD = {}


    print("## Successfully Insert Data !! ##")
    print("##", datetime.datetime.today(), "##")




### Ready for mongodb access ###
mongo_info_file = open('./config/mongo.json').read()
mongo_info = json.loads(mongo_info_file)

MONGO_DB = mongo_info['MONGO_DB']
MONGO_COLLECTION = mongo_info['MONGO_COLLECTION']


### Define ssh tunnel ###
server = SSHTunnelForwarder(
    mongo_info['MONGO_HOST'],
    ssh_username = mongo_info['MONGO_USER'],
    ssh_password = mongo_info['MONGO_PASS'],
    remote_bind_address = ('127.0.0.1', 27017)
)


### Start ssh tunnel ###
server.start()

schedule.every().day.at("23:59").do(job)

while True:
    schedule.run_pending()
    time.sleep(1)

### Close ssh tunnel ###
server.stop()