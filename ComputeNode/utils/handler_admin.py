"""
Copyright 2026 by Herbert Potechius,
Technical University of Berlin
Faculty IV - Electrical Engineering and Computer Science - Institute of Telecommunication Systems - Communication Systems Group
All rights reserved.
This file is released under the "MIT License Agreement".
Please see the LICENSE file that should have been included as part of this package.
"""

import os
import json
import psycopg
from psycopg.rows import dict_row
from .utils import Utils
import datetime

# ------------------------------------------------------------------------------------------------------------------
# Serializes to a JSON-serializable format
# ------------------------------------------------------------------------------------------------------------------
def serialize_row(row):
    for k, v in row.items():
        if isinstance(v, datetime.datetime):
            row[k] = v.isoformat()
    return row    

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get test set results
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetTestSetResults(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    val_set_name = data_recv["set_name"]

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    # get set_id based on the set_name
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM set WHERE name = %s;", (val_set_name, ))
        set_id = cur.fetchone()["id"]

    # get all responses for the set_id
    # EXAMPLE OUTPUT:
    #  value |        name        |         test_name         | dataset_name | participant_id
    # -------+--------------------+---------------------------+--------------+----
    #      3 | Naturalness        | S0V0C0A2I4_S0V4C3A2I6_EA  | TestDataset1 | 15
    #      5 | Similarity         | S0V0C0A2I4_S0V4C3A2I6_EA  | TestDataset1 | 15
    #      5 | gwgwssssssssssssss | S0V0C0A2I4_S0V4C3A2I6_EA  | TestDataset1 | 15
    #      6 | Naturalness        | S0V0C0A2I5_S2V2C2A2I3_EAC | TestDataset1 | 15
    #      5 | Similarity         | S0V0C0A2I5_S2V2C2A2I3_EAC | TestDataset1 | 15
    #      4 | gwgwssssssssssssss | S0V0C0A2I5_S2V2C2A2I3_EAC | TestDataset1 | 15
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT r.value, m.name, i.test_name, i.dataset_name, p.id FROM set_item s LEFT JOIN response r ON r.set_item_id = s.id LEFT JOIN metric m ON r.metric_id = m.id LEFT JOIN item i ON s.item_id = i.id LEFT JOIN participant p ON r.participant_id = p.id WHERE s.set_id = %s;", (set_id,))
        responses = cur.fetchall()

    result = {}

    for row in responses:
        # Schlüssel für Dataset/Test
        dataset_test_key = f"{row['dataset_name']}/{row['test_name']}"
        participant_id = str(row['id'])
        metric_name = row['name']
        value = row['value']

        # Erstelle die verschachtelte Struktur falls nötig
        if dataset_test_key not in result:
            result[dataset_test_key] = {}
        if participant_id not in result[dataset_test_key] and participant_id is not None:
            result[dataset_test_key][participant_id] = {}
        # Setze den Wert für die Metrik
        if participant_id is not None and metric_name is not None:
            result[dataset_test_key][participant_id][metric_name] = value

    # Beispiel-Ausgabe:
    # {
    #   "TestDataset1/S0V0C0A2I4_S0V4C3A2I6_EA": {
    #       15: {
    #           "Naturalness": 3,
    #           "Similarity": 5,
    #           ...
    #       }
    #   },
    #   ...
    # }

    client.send_datachannel_message({
        "message": "/getTestSetResultsResponse",
        "data" : result
    }, client_id)

    conn.commit()
    conn.close()

# ------------------------------------------------------------------------------------------------------------------
#  Handles the submission of user responses for a test set
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetResultFile(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests result file via: {command_recv}.", client.window)
    await client.sendFiles(data_recv, "Image", client_id)

# ------------------------------------------------------------------------------------------------------------------
# Delete user responses for a participant
#
# "command": "/deleteUserResultsRequest",
# "data": {
#   "participant_id": 24
# }
# ------------------------------------------------------------------------------------------------------------------
async def handlerDeleteResults(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    Utils.printRECV(f"Client requests deletion of user results via: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("DELETE FROM response WHERE participant_id = %s;", (data_recv["participant_id"],))
        conn.commit()

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get introductions
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetIntroductions(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    Utils.printRECV(f"Client requests introductions via: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM introduction WHERE name = %s;", (data_recv["test_type"],))
        introductions = cur.fetchall()

    conn.close()

    client.send_datachannel_message({
        "message": "/getIntroductionsResponse",
        "data" : introductions
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to update introductions
# ------------------------------------------------------------------------------------------------------------------
async def handlerPutIntroductions(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests to update introductions via: {command_recv}.", client.window)
    
    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("UPDATE introduction SET text = %s WHERE name = %s;", (data_recv["text"], data_recv["test_type"]))
        conn.commit()

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to delete a test set
# ------------------------------------------------------------------------------------------------------------------
async def handlerDeleteTestSet(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    test_set_structure = [{
        "files": [],
        "name": "root",
        "folders": []
    }]

    Utils.printRECV(f"Client requests deletion of test set {data_recv['set_name']} via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")
    
    # Check if the set is referenced in any responses
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM set WHERE name = %s;", (data_recv["set_name"],))
        set_id = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM response r JOIN set_item si ON r.set_item_id = si.id WHERE si.set_id = %s;", (set_id,))
        count = cur.fetchone()[0]  

    if count > 0:
        Utils.printRECV(f"Cannot delete set {data_recv['set_name']} because it is referenced in user responses.", client.window)
        client.send_datachannel_message({
            "message": "/deleteTestSetResponse",
            "data" : {
                "status": "failed",
                "content": None,
                "message": f"Cannot delete set {data_recv['set_name']} because it is referenced in user responses."
            }
        }, client_id)
        conn.close()
        return

    # Delete set items first due to foreign key constraint
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM set WHERE name = %s;", (data_recv["set_name"],))
        set_id = cur.fetchone()[0]

        cur.execute("DELETE FROM set_item WHERE set_id = %s;", (set_id,))
        conn.commit()

        # Then delete the set itself
        cur.execute("DELETE FROM set WHERE id = %s;", (set_id,))
        conn.commit()

    test_set_structure = getTestSetStructure()

    client.send_datachannel_message({
        "message": "/getTestSetsResponse",
        "data" : {
            "status": "success",
            "content": test_set_structure,
            "message": ""
        }
    }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Gets the file structure of all test sets
# ------------------------------------------------------------------------------------------------------------------
def getTestSetStructure():
    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    test_set_structure = [{
        "files": [],
        "name": "root",
        "folders": []
    }]

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM set;")
        rows = cur.fetchall()

    for row in rows:
        test_set_structure[0]["folders"].append({
            "files": [],
            "name": row["name"],
            "folders": []
        })

        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM set_item WHERE set_id = %s;", (row["id"],))
            set_item_rows = cur.fetchall()
            item_ids = [d["item_id"] for d in set_item_rows]
    
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM item WHERE id = ANY(%s);", (item_ids,))
            items = cur.fetchall()

            for item in items:
                test_set_structure[0]["folders"][-1]["folders"].append({
                    "name": item["test_name"],
                    "isSet": True,
                    "isUserStudyTestFolder": True,
                })

    return test_set_structure

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to update test sets
# ------------------------------------------------------------------------------------------------------------------
async def handlerPutTestSets(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]
    testtype = data_recv["testtype"]
    dataset_name = data_recv["dataset_name"]
    set_name = data_recv["set_name"]
    set_items = data_recv["set_items"]

    Utils.printRECV(f"Client requests updating the test sets via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor() as cur:
        cur.execute("INSERT INTO set (name) VALUES (%s) RETURNING id;", (set_name,))
        set_id = cur.fetchone()[0]
        conn.commit()

    for item in set_items:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                "SELECT * FROM item WHERE dataset_name = %s AND test_name = %s;",
                (dataset_name, item["name"])
            )
            row_id = cur.fetchone()["id"]

        with conn.cursor() as cur:
            cur.execute("INSERT INTO set_item (set_id, item_id) VALUES (%s, %s);", (set_id, row_id))
            conn.commit()

    test_set_structure = getTestSetStructure()

    client.send_datachannel_message({
        "message": "/putTestSetsResponse",
        "data" : {
            "status": "success",
            "content": test_set_structure,
            "message": ""
        }
    }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to delete a metric
# ------------------------------------------------------------------------------------------------------------------
async def handlerDeleteMetric(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests removal of metric {data_recv['name']} via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM metric WHERE name = %s;", (data_recv["name"],))
        conn.commit()

    # After deletion, fetch the updated list of metrics and send to client
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM metric;")
        rows = cur.fetchall()

        client.send_datachannel_message({
            "message": "/deleteMetricResponse",
            "data" : rows
        }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to add a metric
# ------------------------------------------------------------------------------------------------------------------
async def handlerPutMetric(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests addition of metric {data_recv['name']} via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor() as cur:
        cur.execute("INSERT INTO metric (name, min_label, max_label, scale, tooltip) VALUES (%s, %s, %s, %s, %s);", (data_recv["name"], data_recv["min_label"], data_recv["max_label"], data_recv["scale"], data_recv["tooltip"]))
        conn.commit()

    # After addition, fetch the updated list of metrics and send to client
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM metric;")
        rows = cur.fetchall()

        client.send_datachannel_message({
            "message": "/putMetricResponse",
            "data" : rows
        }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to add a participant
# ------------------------------------------------------------------------------------------------------------------
async def handlerPutParticipant(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests addition of participant via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor() as cur:
        cur.execute("INSERT INTO participant (completion_code, test_link, test_type, test_number, valid) VALUES (%s, %s, %s, %s, %s);", (data_recv["completion_code"], data_recv["test_link"], data_recv["test_type"], data_recv["test_number"], data_recv["valid"]))
        conn.commit()

    # After addition, fetch the updated list of participants and send to client
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM participant;")
        rows = cur.fetchall()
        rows = [serialize_row(dict(r)) for r in rows]

        client.send_datachannel_message({
            "message": "/putParticipantResponse",
            "data" : {
                "status": "success",
                "content": rows,
                "message": ""
            }
        }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to delete a participant
# ------------------------------------------------------------------------------------------------------------------
async def handlerDeleteParticipant(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests removal of participant {data_recv['id']} via command: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    # Check if the participant is referenced in any responses
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM response WHERE participant_id = %s;", (data_recv["id"],))
        count = cur.fetchone()[0]
    if count > 0:
        Utils.printRECV(f"Cannot delete participant {data_recv['id']} because they are referenced in user responses.", client.window)
        client.send_datachannel_message({
            "message": "/deleteParticipantResponse",
            "data" : {
                "status": "failed",
                "content": None,
                "message": f"Cannot delete participant {data_recv['id']} because they are referenced in user responses."
            }
        }, client_id)
        return

    with conn.cursor() as cur:
        cur.execute("DELETE FROM participant WHERE id = %s;", (data_recv["id"],))
        conn.commit()

    # After deletion, fetch the updated list of participants and send to client
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM participant;")
        rows = cur.fetchall()
        rows = [serialize_row(dict(r)) for r in rows]

        client.send_datachannel_message({
            "message": "/deleteParticipantResponse",
            "data" : {
                "status": "success",
                "content": rows,
                "message": ""
            }
        }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get user study database structure
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetUserStudyDatabaseStructure(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests user study database structure via command: {command_recv}.", client.window)
    Utils.printSEND(f"Sending user study database structure.", client.window)

    db_structure = Utils.get_database_structure(os.path.abspath("files/study"))

    client.send_datachannel_message({
        "message": "/getUserStudyDatabaseStructureResponse",
        "data" : db_structure
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get user study metrics structure
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetMetrics(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests user study metrics structure via command: {command_recv}.", client.window)
    Utils.printSEND(f"Sending user study metrics structure.", client.window)

    conn = psycopg.connect(
        "dbname=userstudy user=postgres password=postgres host=localhost port=5432"
    )

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM metric;")
        rows = cur.fetchall()

        client.send_datachannel_message({
            "message": "/getMetricsResponse",
            "data" : rows
        }, client_id)

    conn.close()

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get participants
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetParticipants(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests user study participants via: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM participant;")
        rows = cur.fetchall()
        rows = [serialize_row(dict(r)) for r in rows]

        client.send_datachannel_message({
            "message": "/getParticipantsResponse",
            "data" : {
                "status": "success",
                "content": rows,
                "message": ""
            }
        }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get test sets
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetTestSets(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests retrieval of test sets via command: {command_recv}.", client.window)

    test_set_structure = getTestSetStructure()

    client.send_datachannel_message({
        "message": "/getTestSetsResponse",
        "data" : {
            "status": "success",
            "content": test_set_structure,
            "message": ""
        }
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get a user study file for visualization in the preview tab
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetUserStudyFile(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests user study file via: {command_recv}.", client.window)

    await client.sendFiles(data_recv, "Image", client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get user study metadata
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetUserStudyMeta(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]
    data_recv = data_recv_string["data"]

    Utils.printRECV(f"Client requests user study metadata via: {command_recv}.", client.window)

    json_path = os.path.join("files/study", data_recv["abstractPath"])
    with open(json_path, "r") as f:
        json_content = json.load(f)

    json_content["abstractPath"] = data_recv["abstractPath"].rsplit("/", 1)[0]
    client.send_datachannel_message({
        "message": "/getUserStudyMetaResponse",
        "data" : json_content
    }, client_id)

# ------------------------------------------------------------------------------------------------------------------
# Handles the request to get a user study results
# ------------------------------------------------------------------------------------------------------------------
async def handlerGetResults(client, message, client_id):
    data_recv_string = json.loads(message)
    command_recv = data_recv_string["command"]

    Utils.printRECV(f"Client requests user study results via: {command_recv}.", client.window)

    conn = psycopg.connect("dbname=userstudy user=postgres password=postgres host=localhost port=5432")

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("""
            SELECT 
                p.id AS user_id,
                MAX(CASE WHEN m.name = 'Naturalness' THEN r.value END) AS naturalness,
                MAX(CASE WHEN m.name = 'Similarity to the reference:' THEN r.value END) AS similarity,
                MAX(CASE WHEN m.name = 'Artifacts' THEN r.value END) AS artifacts,
                MAX(CASE WHEN m.name = 'Overall quality:' THEN r.value END) AS overall_quality,
                i.test_name,
                i.dataset_name,
                s.name AS set_name,
                i.meta
            FROM response r
            JOIN metric m ON r.metric_id = m.id
            JOIN participant p ON p.id = r.participant_id
            JOIN set_item si ON r.set_item_id = si.id
            JOIN set s ON s.id = si.set_id
            JOIN item i ON i.id = si.item_id
            GROUP BY p.id, i.id, i.test_name, i.dataset_name, s.name, i.meta
            ORDER BY p.id;
        """)
        rows = cur.fetchall()

        client.send_datachannel_message({
            "message": "/getResultsResponse",
            "data" : rows
        }, client_id)