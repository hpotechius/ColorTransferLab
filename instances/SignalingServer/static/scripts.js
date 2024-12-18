function sortTable(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("clientsTable");
    switching = true;
    dir = "asc"; 
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

// function applyStatusColors() {
//     var statusCells = document.querySelectorAll('.status-box');
//     statusCells.forEach(function(cell) {
//         if (cell.innerHTML.includes('Idle')) {
//             cell.style.backgroundColor = 'red';
//         } else if (cell.innerHTML.includes('Active')) {
//             cell.style.backgroundColor = 'green';
//         } else if (cell.innerHTML.includes('Offline')) {
//             cell.style.backgroundColor = 'gray';
//         }
//     });
// }

// function applyTypeColors() {
//     var typeCells = document.querySelectorAll('.type-box');
//     typeCells.forEach(function(cell) {
//         if (cell.innerHTML.includes('Client')) {
//             cell.style.backgroundColor = 'gray';
//         } else if (cell.innerHTML.includes('DBServer')) {
//             cell.style.backgroundColor = 'lightblue';
//         } else if (cell.innerHTML.includes('CEServer')) {
//             cell.style.backgroundColor = 'orange';
//         }
//     });
// }

// document.addEventListener('DOMContentLoaded', function() {
//     applyStatusColors();
//     applyTypeColors();
// });