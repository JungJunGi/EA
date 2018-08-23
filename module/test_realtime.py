
### 실시간 데이터를 마리아디비에서 가져오기 !! ###
### 김지연 ###

import time
import sys
import os
import pymysql
import json
import datetime



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
com = ""

dsitemD = {}
dsitemL = []
docD = {}
metaD = {}
dd = {}



### Today is ... ###
today = time.localtime(time.time())

year = str(today.tm_year)
month = str(today.tm_mon)

if month.__len__()<2:
    month = "0" + month

date = year + month



### Ready for mariadb connect ###
db = pymysql.connect(
                        host = "www.lems.mbz.kr",
                        user = "lems_user",
                        passwd = "Pass_%$#@",
                        db = "POWERMON",
                        port = 10336,
                        charset = "euckr"
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

for k in comNameDict.keys():
    if comNameDict.get(k) == sys.argv[1]:
        com = comNameDict.get(k)
        break

### Data Format ###
for dept in companyDict.get(com):  # 원하는 company의 depart
    for item in dsitemDict.keys():  # 원하는 data item
        sql = """
        SELECT MDATETIME, DSITEMVAL  FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B 
        WHERE A.DSID = B.FromDSID    AND A.DISTBDID = B.FromDISTBDID 
        AND A.DSID = %s   AND A.DISTBDID = %s   AND DSITEMID = %s   AND DATE_FORMAT(MDATETIME, %s) = %s
        """
        dataNum = cursor.execute(sql, (int(date), dept[0], dept[1], item, "%Y-%m-%d"))
        row = [item for item in cursor.fetchall()]
        for r in row:
            r = list(r)
            r[0] = str(r[0])
            r[1] = str(r[1])
            dsitemD["date"] = r[0]
            dsitemD["value"] = r[1]
            dsitem = json.dumps(dsitemD)
            dsitemL.append(dsitem)

        metaD["company"] = comNameDict.get(com)
        metaD["year"] = date[:4]
        metaD["month"] = date[4:]
        metaD["item"] = dsitemDict.get(item)
        metaD["depart"] = dept[2]
        docD["meta"] = metaD
        docD["data"] = dsitemL
        dd["meta"] = metaD

        if len(dsitemL) != 0:
            print(docD)

        dsitemD = {}
        dsitemL = []
        docD = {}
        metaD = {}
