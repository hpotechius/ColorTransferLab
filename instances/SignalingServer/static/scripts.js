// ------------------------------------------------------------------------------------------------------------------
// Function to sort a table based on the column index
// ------------------------------------------------------------------------------------------------------------------
function sortTable(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("clientsTable"); // Get the table element
    switching = true; // Set the switching flag to true to start the loop
    dir = "asc"; // Set the initial sorting direction to ascending

    // Loop until no switching is needed
    while (switching) {
        switching = false; // Reset the switching flag
        rows = table.rows; // Get all the rows in the table

        // Loop through all table rows (except the first, which contains table headers)
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false; // Reset the shouldSwitch flag
            x = rows[i].getElementsByTagName("TD")[columnIndex]; // Get the current cell
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex]; // Get the next cell

            // Check if the two rows should switch place based on the direction
            if (dir == "asc") {
                // If the current cell is greater than the next cell, mark as a switch
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                // If the current cell is less than the next cell, mark as a switch
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }

        // If a switch has been marked, perform the switch and mark that a switch has been done
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