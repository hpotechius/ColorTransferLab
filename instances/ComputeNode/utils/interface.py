from PyQt6.QtWidgets import QApplication, QMainWindow, QPushButton, QHBoxLayout, QVBoxLayout, QLineEdit, QWidget, QLabel, QFrame, QTextEdit, QSpacerItem, QSizePolicy, QProgressBar, QCheckBox
from PyQt6.QtGui import QColor
from qasync import QEventLoop, asyncSlot
from datetime import datetime
import asyncio
import pkg_resources
from PyQt6.QtCore import QMetaObject, Qt, Q_ARG

import ColorTransferLib
import os
from utils.utils import Utils
import requests
import zipfile
import threading

# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#
# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class MainWindow(QMainWindow):
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init__(self, main_server=None, signal_server=None):
        super().__init__()
        self.setWindowTitle("ColorTransferLabV2 - ComputeNode - Version 1.0.0")
        self.setGeometry(100, 100, 500, 700)
        self.setFixedSize(500, 800)  # Setzt die feste Größe des Fensters
        self.center()

        self.terminal = None
        self.signal_server_status = None
        self.compute_node_status = None

        self.main_server = main_server
        self.signal_server = signal_server
        self.compute_node_name = "ComputeNode-" + Utils.generate_random_string()
        self.compute_node_privacy = False

        # Haupt-Widget und Layout
        main_widget = QWidget()
        main_layout = QVBoxLayout()

        # Init Information Block
        main_layout.addLayout(self.__init_information_block())

        # Abstand hinzufügen
        spacer = QSpacerItem(20, 10, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Fixed)
        main_layout.addItem(spacer)
 
        # Init Signal Server Block
        main_layout.addLayout(self.__init_signalserver_block())

        # Abstand hinzufügen
        spacer = QSpacerItem(20, 10, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Fixed)
        main_layout.addItem(spacer)    

        # Init Compute Node Block
        main_layout.addLayout(self.__init_computenode_block())

        # Abstand hinzufügen
        spacer = QSpacerItem(20, 10, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Fixed)
        main_layout.addItem(spacer)    

        # Init Compute Node Block
        main_layout.addLayout(self.__init_client_block())

        # Abstand hinzufügen
        spacer = QSpacerItem(20, 40, QSizePolicy.Policy.Minimum, QSizePolicy.Policy.Fixed)
        main_layout.addItem(spacer)    


        # Init Terminal Block
        main_layout.addWidget(self.__init_terminal_block())



        button = QPushButton(f"Connect to Signal Server")
        button.clicked.connect(self.on_button_click)

        main_layout.addWidget(button)



        main_widget.setLayout(main_layout)
        self.setCentralWidget(main_widget)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_signal_server_status(self, status):
        self.signal_server_status.setText(status)
        if status == "Online" or status == "Connected":
            self.signal_server_status.setStyleSheet("color: green;")
        else:
            self.signal_server_status.setStyleSheet("color: red;")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_compute_node_status(self, status):
        self.compute_node_status.setText(status)
        if status == "Idle":
            self.compute_node_status.setStyleSheet("color: yellow;")
        elif status == "Connected":
            self.compute_node_status.setStyleSheet("color: green;")
        else:
            self.compute_node_status.setStyleSheet("color: grey;")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_compute_node_ip_address(self, status):
        self.compute_node_ip_address.setText(status)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_compute_node_name(self, status):
        self.compute_node_name_val.setText(status)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_client_ip_address(self, status):
        self.client_ip_address.setText(status)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_client_id(self, status):
        self.client_id.setText(status)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_client_name(self, status):
        self.client_name.setText(status)
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_client_status(self, status):
        self.client_status.setText(status)
        if status == "Idle":
            self.client_status.setStyleSheet("color: yellow;")
        elif status == "Connected":
            self.client_status.setStyleSheet("color: green;")
        else:
            self.client_status.setStyleSheet("color: white;")
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def set_compute_node_id(self, id):
        self.compute_node_id.setText(id)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def center(self):
        screen = self.screen().geometry()
        size = self.geometry()
        self.move(
            (screen.width() - size.width()) // 2,
            (screen.height() - size.height()) // 2
        )

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init_information_block(self):
        box_layout = QVBoxLayout()
        label = QLabel(f"General Information:")
        font = label.font()
        font.setBold(True)
        label.setFont(font)
        label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        box_layout.addWidget(label)

        # Trennstrich hinzufügen
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        box_layout.addWidget(separator)

        hbox_layout = QHBoxLayout()
        label_databasepath = QLabel(f"Database Path:")
        label_databasepath.setFixedSize(190, 20)
        label_databasepath.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_databasepath)
        relative_path = "files/data"
        absolute_path = os.path.abspath(relative_path)
        label2 = QLabel(absolute_path)
        label2.setToolTip(absolute_path)
        hbox_layout.addWidget(label2)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_colortransferlibver = QLabel(f"ColorTransferLib Version:")
        label_colortransferlibver.setFixedSize(190, 20)
        label_colortransferlibver.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_colortransferlibver)
        colortransferlib_version = pkg_resources.get_distribution("ColorTransferLib").version
        label_colortransferlibver_val = QLabel(colortransferlib_version)
        hbox_layout.addWidget(label_colortransferlibver_val)
        box_layout.addLayout(hbox_layout)



        return box_layout
    
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init_signalserver_block(self):
        box_layout = QVBoxLayout()
        label = QLabel(f"Signal Server Information:")
        font = label.font()
        font.setBold(True)
        label.setFont(font)
        label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        box_layout.addWidget(label)

        # Trennstrich hinzufügen
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        box_layout.addWidget(separator)

        hbox_layout = QHBoxLayout()
        label_signalserverurl = QLabel(f"URL:")
        label_signalserverurl.setFixedSize(190, 20)
        label_signalserverurl.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        label_signalserverurl.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_signalserverurl)

        self.lineedit_signalserverurl = QLineEdit()
        self.lineedit_signalserverurl.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.lineedit_signalserverurl.returnPressed.connect(self.update_signal_server_url)  # Verbindung des returnPressed-Signals
        self.lineedit_signalserverurl.setPlaceholderText(self.signal_server)
        hbox_layout.addWidget(self.lineedit_signalserverurl)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_signalserverstatus = QLabel(f"Status:")
        label_signalserverstatus.setFixedSize(190, 20)
        label_signalserverstatus.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_signalserverstatus)
        self.signal_server_status = QLabel(f"Offline")
        self.signal_server_status.setStyleSheet("color: red;")
        hbox_layout.addWidget(self.signal_server_status)
        box_layout.addLayout(hbox_layout)

        return box_layout

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def update_signal_server_url(self):
        new_url = self.lineedit_signalserverurl.text()
        print(new_url)
        if new_url:
            self.signal_server = new_url

            try:
                ss_reachable = Utils.is_address_reachable(new_url)
                if ss_reachable:
                    self.set_signal_server_status("Online")
                else:
                    self.set_signal_server_status("Offline")
                    Utils.printINFO(f"Signal server {new_url} is not available.", self)
            except Exception as e:
                self.set_signal_server_status("Offline")
                Utils.printINFO(f"Signal server {new_url} is not available.", self)

            # self.label_signalserverurl_val.setText(new_url)


    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def update_compute_node_name(self):
        new_name = self.compute_node_name_val.text()
        if new_name:
            self.compute_node_name = new_name

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init_computenode_block(self):
        box_layout = QVBoxLayout()
        label = QLabel(f"Compute Node Information:")
        font = label.font()
        font.setBold(True)
        label.setFont(font)
        label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        box_layout.addWidget(label)

        # Trennstrich hinzufügen
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        box_layout.addWidget(separator)

        hbox_layout = QHBoxLayout()
        label_server_name = QLabel(f"Name:")
        label_server_name.setFixedSize(190, 20)
        label_server_name.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_name)

        self.compute_node_name_val = QLineEdit()
        self.compute_node_name_val.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.compute_node_name_val.returnPressed.connect(self.update_compute_node_name)  # Verbindung des returnPressed-Signals
        self.compute_node_name_val.setPlaceholderText(self.compute_node_name)
        hbox_layout.addWidget(self.compute_node_name_val)
        box_layout.addLayout(hbox_layout)


        hbox_layout = QHBoxLayout()
        label_server_address = QLabel(f"IP Address:")
        label_server_address.setFixedSize(190, 20)
        label_server_address.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_address)
        self.compute_node_ip_address = QLabel(f"null")
        hbox_layout.addWidget(self.compute_node_ip_address)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_id = QLabel(f"ID:")
        label_id.setFixedSize(190, 20)
        label_id.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        label_id.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_id)
        self.compute_node_id = QLabel(f"null")
        self.compute_node_id.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        hbox_layout.addWidget(self.compute_node_id)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_server_status = QLabel(f"Status:")
        label_server_status.setFixedSize(190, 20)
        label_server_status.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_status)
        self.compute_node_status = QLabel(f"Disconnected")
        hbox_layout.addWidget(self.compute_node_status)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_compute_node_privacy = QLabel(f"Private:")
        label_compute_node_privacy.setFixedSize(190, 20)
        label_compute_node_privacy.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_compute_node_privacy)
        self.label_compute_node_privacy_val = QCheckBox()
        self.label_compute_node_privacy_val.setChecked(False)  # Standardmäßig nicht aktiviert
        self.label_compute_node_privacy_val.stateChanged.connect(self.on_comptue_node_privacy_changed)
        hbox_layout.addWidget(self.label_compute_node_privacy_val)
        box_layout.addLayout(hbox_layout)

        return box_layout
    
    def on_comptue_node_privacy_changed(self, state):
        if state == 2:
            self.compute_node_privacy = True
        else:
            self.compute_node_privacy = False
        
    
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init_terminal_block(self):
        frame = QFrame()
        frame.setFrameShape(QFrame.Shape.Box)
        frame.setLineWidth(1)
        box_layout = QVBoxLayout()

        # Layout für Label und Trennstrich
        label = QLabel(f"Terminal:")
        font = label.font()
        font.setBold(True)
        label.setFont(font)
        label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        box_layout.addWidget(label)

        # Trennstrich hinzufügen
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        box_layout.addWidget(separator)

        # Textbox hinzufügen
        text_edit = QTextEdit()
        text_edit.setReadOnly(True)  # Optional: Nur lesbar machen
        box_layout.addWidget(text_edit)
        self.terminal = text_edit

        # Fortschrittsbalken hinzufügen
        self.progress_bar = QProgressBar()
        box_layout.addWidget(self.progress_bar)

        frame.setLayout(box_layout)
        return frame
    
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init_client_block(self):
        box_layout = QVBoxLayout()
        label = QLabel(f"Client Information:")
        font = label.font()
        font.setBold(True)
        label.setFont(font)
        label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        box_layout.addWidget(label)

        # Trennstrich hinzufügen
        separator = QFrame()
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        box_layout.addWidget(separator)


        hbox_layout = QHBoxLayout()
        label_client_name = QLabel(f"Name:")
        label_client_name.setFixedSize(190, 20)
        label_client_name.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_client_name)
        self.client_name = QLabel(f"null")
        self.client_name.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)

        hbox_layout.addWidget(self.client_name)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_server_address = QLabel(f"IP Address:")
        label_server_address.setFixedSize(190, 20)
        label_server_address.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_address)
        self.client_ip_address = QLabel(f"null")
        hbox_layout.addWidget(self.client_ip_address)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_server_status = QLabel(f"ID:")
        label_server_status.setFixedSize(190, 20)
        label_server_status.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_status)
        self.client_id = QLabel(f"null")
        hbox_layout.addWidget(self.client_id)
        box_layout.addLayout(hbox_layout)

        hbox_layout = QHBoxLayout()
        label_server_status = QLabel(f"Status:")
        label_server_status.setFixedSize(190, 20)
        label_server_status.setStyleSheet("color: grey;")
        hbox_layout.addWidget(label_server_status)
        self.client_status = QLabel(f"null")
        hbox_layout.addWidget(self.client_status)
        box_layout.addLayout(hbox_layout)

        return box_layout

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def get_timestamp(self):
        now = datetime.now()
        return now.strftime("%H:%M:%S")

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def append_text_to_terminal(self, text_edit, text):
        text_edit.append("[" + self.get_timestamp() + "] " + text)

    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def print_to_terminal(self, text, msg_type="info"):
        if msg_type == "info":
            col = "orange"
        elif msg_type == "recv":
            col = "lightblue"
        elif msg_type == "send":
            col = "lightgreen"
        else:
            col = "grey"

        self.terminal.setTextColor(QColor(col))
        self.append_text_to_terminal(self.terminal, text)
        self.terminal.setTextColor(QColor("grey"))

    def update_progress_bar(self, downloaded, total_length):
        progress = int(downloaded / total_length * 100)
        # QMetaObject.invokeMethod prevents the QPaintDevice and Segmentation fault error
        QMetaObject.invokeMethod(self.progress_bar, "setValue", Qt.ConnectionType.QueuedConnection, Q_ARG(int, progress))

        if progress >= 100:
            QMetaObject.invokeMethod(self.progress_bar, "hide", Qt.ConnectionType.QueuedConnection)




    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    @asyncSlot()
    async def on_button_click(self):
        # asyncio-Funktionen starten
        asyncio.ensure_future(self.main_server(self))

# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
#





# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
class Interface():
    # ------------------------------------------------------------------------------------------------------------------
    # 
    # ------------------------------------------------------------------------------------------------------------------
    def __init__(self, main_server, signal_server):
        app = QApplication([])

        # qasync-Event-Loop starten
        loop = QEventLoop(app)
        asyncio.set_event_loop(loop)

        window = MainWindow(main_server, signal_server)
        window.show()

        asyncio.ensure_future(Utils.download_and_extract(window))

        # Download Dataset
        # Download Dataset in einem separaten Thread

        # folder_path_data = "files/data/data"
        # folder_path_preview = "files/data/data"
        # if not check_folder_exists(folder_path_data) and not check_folder_exists(folder_path_preview):
        #     Utils.printINFO(f"Download Database...", window)
        #     url = "https://potechius.com/Downloads/Datasets/ColorTransferLab_Database.zip"
        #     # url = "https://potechius.com/Downloads/Datasets/Test.zip"
        #     absolute_folder_path = os.path.abspath("files")
        #     local_filename = absolute_folder_path + "/ColorTransferLab_Database.zip"
        #     download_file(url, local_filename, window.update_progress_bar)

        #     Utils.printINFO(f"Database extracted to {absolute_folder_path}", window)
        #     extract_zip_file(local_filename, absolute_folder_path)

        ss_reachable = Utils.is_address_reachable(signal_server)
        if ss_reachable:
            window.set_signal_server_status("Online")
        else:
            window.set_signal_server_status("Offline")
            Utils.printINFO(f"Signal server {signal_server} is not available.", window)

        with loop:
            loop.run_forever()  # Lässt Qt und asyncio dauerhaft laufen

