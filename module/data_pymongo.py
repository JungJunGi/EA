# http://brownbears.tistory.com/282 #

from sshtunnel import SSHTunnelForwarder
import pymongo
import time
import sys
import os
import pymysql
import json

### ready for mongodb access
MONGO_HOST = "203.252.208.247"
MONGO_PORT = 22
MONGO_USER = "elec"
MONGO_PASS = "vmlab347!"
MONGO_DB = "MongoTest"
MONGO_COLLECTION = "test"

### define ssh tunnel
server = SSHTunnelForwarder(
    MONGO_HOST,
    ssh_username = MONGO_USER,
    ssh_password = MONGO_PASS,
    remote_bind_address = ('127.0.0.1', 27017)
)

### start ssh tunnel
server.start()

client = pymongo.MongoClient('127.0.0.1', server.local_bind_port)
db = client[MONGO_DB]


collection = db[MONGO_COLLECTION]
# collection.insert_one({"number":0})

result = collection.find()
for r in result:
    print(r)


### close ssh tunnel
server.stop()





'''
company = []

fpath = "C:\\Users\\DS\\Documents\\mydata"

# 현재 폴더명, 현재폴더의 하위 디렉터리 목록, 파일명 목록
for dirName, subDirList, fnames in os.walk(fpath) :
    for subDir in subDirList :
        company.append(subDir)

# print(company)

# for dirName, subDirList, fnames in os.walk(fpath) :
#     for fname in fnames :
#         myfile = os.path.join(dirName, fname)
#         jsonfiles.append(myfile)

# print(jsonfiles)
'''

'''
dsitemD = {}
dsitemL = []
docD = {}
metaD = {}
dataNum = 0

### MongoDB access ###

MONGO_HOST = "203.252.208.247"
MONGO_PORT = 22
MONGO_DB = "ourdb"
MONGO_USER = "elec"
MONGO_PASS = "vmlab347!"

con = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
db = con[MONGO_DB]
db.authenticate(MONGO_USER, MONGO_PASS)



for com in companyDict.keys():
    for dept in companyDict.get(com):
        for item in dsitemDict.keys():
            for year_n in year.keys():

                for y in year.get(year_n):
                    sql = "SELECT MDATETIME, DSITEMVAL  FROM DATA_MEASURE_%s A, INFO_DS125_WebVersion B  WHERE B.FromDSID = A.DSID AND A.DSID = %s AND A.DISTBDID = %s AND DSITEMID = %s"
                    dataNum = cursor.execute(sql, (y, dept[0], dept[1], item))
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
                metaD["year"] = year_n
                metaD["item"] = dsitemDict.get(item)
                metaD["depart"] = dept[2]
                docD["meta"] = metaD
                docD["data"] = dsitemL
                docD = str(docD)
                if len(dsitemL) != 0:
                    filename = 'C:\\Users\\DS\\Documents\\mydata\\' + comNameDict.get(com) + '\\' + str(dept[0]) + '_' + str(dept[1]) + '_' + str(item) + '_' + str(year_n) + '.json'
                    os.makedirs(os.path.dirname(filename), exist_ok=True)
                    # f = open(filename, 'wt')
                    # f.write(docD)
                    # print(filename)
                # col = db[%s], comNameDict
                col = db[comNameDict]
                post_id = col.insert_one(docD).inserted_id
                print(post_id)

                dsitemD = {}
                dsitemL = []
                docD = {}
                metaD = {}


collection = db.collection_names(include_system_collections=False)
for collect in collection:
    print(collect)

'''