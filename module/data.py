import pymongo
import time
import sys
import pymysql
import json
 
### Ready for data ###
group_companyID = [] 
group_companyName = []
group_companyDepart=[]
group_date = []
group_value = []
row = []
companyDict = {}

year = {}
data_2017 = [201706,201707,201708,201709,201710,201711,201712]
data_2018 = [201801,201802,201803,201804,201805,201806,201807]
year["2017"] = data_2017
year["2018"] = data_2018
 
db = pymysql.connect(
                        host = "www.lems.mbz.kr",
                        user = "lems_user",
                        passwd = "Pass_%$#@",
                        db = "POWERMON",
                        port = 10336,
                        charset = "euckr"
                    )
    
cursor = db.cursor()

# sql = "SELECT MDATETIME, DSITEMVAL FROM DATA_MEASURE_201707 A, INFO_DS125_WebVersion B "
# sql += "WHERE B.FromDSID = A.DSID AND COMPANY_ID = 27 AND A.DSID = 89 AND A.DISTBDID = 3 AND DSITEMID =3 AND B.FromDISTBDID = 3 ORDER BY MDATETIME"
 
### Read companyID & companyName from sql ###
sql = "SELECT COMPANY_ID, COMPANY_NAME FROM INFO_COMPANY"
companyNum = cursor.execute(sql)
row = [item for item in cursor.fetchall()]
group_companyID, group_companyName = zip(*row)
comNameDict = dict(zip(group_companyID, group_companyName))
# print(companyDict)


### Init ###
row = []
 
### Read depart info ###
for i in range(0, companyNum):
    sql = "SELECT FromDSID, FromDISTBDID, DSNAME  FROM INFO_DS125_WebVersion WHERE COMPANY_ID = %s AND FromDSID IS NOT NULL"
    departNum = cursor.execute(sql, (group_companyID[i]))
    row = [item for item in cursor.fetchall()]
    group_companyDepart.append(list(row))
companyDict = dict(zip(group_companyID, group_companyDepart))
# print(companyDict.get(27)[0])
# print(companyDict)



### Init ###
row = []
 
### Read DSITEM ###
sql = "SELECT DSITEMID, DSITEMNAMEENG FROM INFO_DS125_ITEM ORDER BY DSITEMID"
itemNum = cursor.execute(sql)
row = [item for item in cursor.fetchall()]
group_dsitemID, group_dsitemNAME = zip(*row)
dsitemDict = dict(zip(group_dsitemID, group_dsitemNAME))
# print(dsitemDict)
 
# print(group_companyDepart)
# print(group_companyID)
# print(group_companyName)
# print(dsitemDict)
# print(group_companyDepart[0][0][1])
 
row = []
dsitemD = {}
dsitemL = []
docD = {}
metaD = {}


### MongoDB access ###
'''
client = pymongo.MongoClient('203.252.208.247',27017)
db = client['349']
 
for com in companyDict.keys():
    for dept in companyDict.get(com):
        for item in dsitemDict.keys():
            for year_n in year.keys():
                for y in year.get(year_n):
                    sql = "SELECT MDATETIME, DSITEMVAL FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B WHERE B.FromDSID = A.DSID AND A.DSID=%s AND A.DISTBDID=%s AND DSITEMID=%s"
                    dataNum = cursor.execute(sql,(y,dept[0],dept[1],item))
                    row = [item for item in cursor.fetchall()]
                    for r in row:
                        r=list(r)
                        r[0]=str(r[0])
                        r[1]=str(r[1])
                        dsitemD["date"]=r[0]
                        dsitemD["value"]=r[1]
                        dsitem = json.dumps(dsitemD)
                        dsitemL.append(dsitem)
                metaD["company"]=comNameDict.get(com)
                metaD["year"]=year_n
                metaD["item"]=dsitemDict.get(item)
                metaD["depart"]=dept[2]
                docD["meta"]=metaD
                docD["data"]=dsitemL
                docD = str(docD)
                if len(dsitemL)!=0:
                    filename='c:\\Users\\duksung1\\Desktop\\H\\LAB\\json\\'+comNameDict.get(com)+'\\'+str(dept[0])+'_'+str(dept[1])+'_'+str(item)+'_'+str(year_n)+'.json'
                    os.makedirs(os.path.dirname(filename), exist_ok=True)
                    f = open(filename, 'wt')
                    f.write(docD)
                col = db[%s], comNameDict
                dsitemD={}
                dsitemL=[]
                docD={}
                metaD={}
        
 
 
 
#print(row)
#print(group_date)
#print(group_value)
'''