import requests
import json
import sqlite3
from sqlite3 import Error


#def create_connection(db_file):
#    """ create a database connection to a SQLite database """
#    try:
#        conn = sqlite3.connect(db_file)
#        print(sqlite3.version)
#    except Error as e:
#        print(e)
#    finally
#        conn.close()

subject_list  = ["ACCT","AEGD","AERO","AERS","AFST","AGCJ","AGEC","AGLS","AGSC","AGSM","ALEC","ALED","ANSC","ANTH","ARAB","ARCH","ARTS","ASCC","ASIA","ASTR","ATMO","ATTR","BAEN",
"BEFB","BESC","BICH","BIED","BIMS","BIOE","BIOL","BIOT","BMEN","BUAD","BUSH","BUSN","CARC","CEHD","CHEM","CHEN","CHIN","CLAS","CLEN","CLGE","CLSC","CLSL","COMM",
"COMP","COSC","CPSY","CSCE","CVEN","DASC","DCED","DDHS","DPHS","ECEN","ECMT","ECON","EDAD","EDCI","EDHP","EDTC","EEBL","EHRD","ENDO","ENDS","ENGL","ENGR","ENTC","ENTO","EPFB",
"EPSY","ESET","ESSM","EURO","FILM","FINC","FIVS","FREN","FRSC","FSTC","GENE","GEOG","GEOL","GEOP","GEOS","GERM","GS01","GS03","GS04","HCPI","HEFB","HHUM","HISP",
"HIST","HLTH","HORT","HPCH","IBST","IBUS","ICPE","IDIS","INST","INTA","INTS","ISEN","ISTM","ITAL","ITDE","JAPN","JOUR","KINE","KNFB","LAND","LAW",
"LBAR","LDEV","LING","MASC","MATH","MEEN","MEFB","MEID","MEMA","MEPS","MGMT","MKTG","MLSC","MMET","MODL","MPHY","MPIM","MSCI","MSEN","MUSC","MXET",
"NEXT","NFSC","NRSC","NUEN","NURS","NVSC","OBIO","OCEN","OCNG","OMFP","OMFR","OMFS","ORTH","PEDD","PERF","PERI","PETE","PHAR","PHEB","PHEO","PHIL","PHLT","PHPM","PHYS","PLAN",
"PLPA","POLS","POSC","PROS","PSAA","PSYC","RDNG","RELS","RENR","RPTS","RUSS","SABR","SCEN","SCMT","SCSC","SEFB","SENG","SOCI","SOMS","SOPH","SPAN","SPED","SPMT","SPSY","STAT",
"TCMG","TCMT","TEED","TEFB","THAR","UGST","URPN","URSC","VIBS","VIST","VIZA","VLCS","VMID","VPAT","VSCS","VTMI","VTPB","VTPP","WFSC","WGST","WMHS"]

if __name__ == '__main__':
    db = sqlite3.connect("initial.db")

    with db:
        cur = db.cursor()

        cur.execute("CREATE TABLE section_grades (sem TEXT, prof TEXT, dept TEXT, course_nbr TEXT, course_name TEXT, a INT, b INT, c INT, d INT, f INT, totalAF INT)")

        for dept in subject_list:
            for course_nbr_int in range(100, 1000):
                course_nbr = str(course_nbr_int)
                j = requests.get('http://www.aggiescheduler.com/api/grades?course=' + course_nbr + '&subject=' + dept)
                j_file = j.json()
                if j_file:
                    print(dept + " " + course_nbr)
                    grade_history = j_file.get('gradeHistory')
                    if grade_history:
                        for prof in grade_history:
                            prof_dict = grade_history.get(prof)
                            if prof_dict:
                                for sem in prof_dict:
                                    #find course name
                                    if int(sem) >= 20171:
                                        r = requests.get('http://www.aggiescheduler.com/api/search?search=' + dept + '&term=' + sem + '1')
                                    else:
                                        r = requests.get('http://www.aggiescheduler.com/api/search?search=' + dept + '&term=' + '20171' + '1')
                                    r_file = r.json()
                                    course_name = ''
                                    for cn_dict in r_file:
                                        if cn_dict.get("course") == course_nbr:
                                            course_name = cn_dict.get('title')
                                    sem_dict = prof_dict.get(sem)
                                    if sem_dict:
                                        a = 0
                                        b = 0
                                        c = 0
                                        d = 0
                                        f = 0
                                        totalAF = 0
                                        for section_nbr in sem_dict:
                                            section_dict = sem_dict.get(section_nbr)
                                            a += section_dict.get("a")
                                            b += section_dict.get("b")
                                            c += section_dict.get("c")
                                            d += section_dict.get("d")
                                            f += section_dict.get("f")
                                            totalAF += section_dict.get('totalAF')
                                            """print('sem: ' + sem)
                                            print('prof: ' + prof)
                                            print('dept: ' + dept)
                                            print('course_nbr: ' + course_nbr)
                                            print('course_name: ' + course_name)
                                            print('a: ' + str(a))
                                            print('b: ' + str(b))
                                            print('c: ' + str(c))
                                            print('d: ' + str(d))
                                            print('f: ' + str(f))
                                            print('totalAF: ' + str(totalAF))
                                            print('section_nbr: ' + section_nbr)
                                            print('***************************')"""
                                        cur.execute("INSERT INTO section_grades VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (sem, prof, dept, course_nbr, course_name, a, b, c, d, f, totalAF))

                                        #TODO:write to file here...
    db.close()
