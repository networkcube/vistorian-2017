var DATA_TABLE_MAX_LENGTH = 200;
document.getElementById('files').addEventListener('change', getFileInfos, false);
var SESSION_NAME = utils.getUrlVars()['session'];
storage.saveSessionId();
var tables = storage.getUserTables();
var currentNetwork;
var visualizations = [
    ['Node Link', 'nodelink'],
    ['Adjacency Matrix', 'matrix'],
    ['Dynamic Ego Network', 'dynamicego'],
    ['Map', 'map'],
];
var messages = [];
init();
function init() {
    loadVisualizationList();
    loadNetworkList();
    loadTableList();
}
function loadVisualizationList() {
    visualizations.forEach(function (v) {
        $('#visualizationList')
            .append('<li class="visLink" title="Show ' + v[0] + ' visualization.">\
                        <button onclick="loadVisualization(\'' + v[1] + '\')" class="visbutton hastooltip">\
                            <img src="logos/vis-' + v[1] + '.png" class="menuicon" />'
            + v[0] + '\
                        </button>\
                    </li>');
    });
    $('#visualizationList')
        .append('<li class="visLink" title="Show matrix and node-link split-view."><button onclick="loadVisualization(\'mat-nl\')" class="visbutton hastooltip"><img src="logos/mat-nl.png" class="menuicon"/>Matrix + Node Link\
        </button></li>');
    $('#visualizationList')
        .append('<li class="visLink" title="Show all visualizations."><button onclick="loadVisualization(\'tileview\')" class="visbutton hastooltip"><img src="logos/tiled.png" class="menuicon"/>All\
        </button></li>');
}
function loadTableList() {
    $('#tableList').empty();
    var tableNames = storage.getTableNames();
    tableNames.forEach(function (t) {
        var shownName = t;
        if (t.length > 30)
            shownName = t.substring(0, 30) + '..';
        $('#tableList').append('<li>\
            <a onclick="showSingleTable(\'' + t + '\')"  class="underlined">' + shownName + '.csv</a>\
            <img class="controlIcon" title="Delete this table." src="logos/delete.png" onclick="removeTable(\'' + t + '\')"/>\
        </li>');
    });
}
function loadNetworkList() {
    $('#networkList').empty();
    var networkNames = storage.getNetworkIds();
    var network;
    networkNames.forEach(function (t) {
        network = storage.getNetwork(t);
        $('#networkList').append('\
            <li>\
                <a onclick="showNetwork(\'' + network.id + '\')"  class="underlined">' + network.name + '</a>\
                <img class="controlIcon" title="Delete this network." src="logos/delete.png" onclick="removeNetwork(\'' + network.id + '\')"/>\
                <img class="controlIcon" title="Download this network in JSON format." src="logos/download.png" onclick="exportNetwork(\'' + network.id + '\')"/>\
            </li>');
    });
}
function loadVisualization(visType) {
    window.open('sites/' + visType + '.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name);
}
function createNetwork() {
    var networkIds = storage.getNetworkIds();
    var id = 1;
    if (networkIds.length > 0) {
        id = networkIds[networkIds.length - 1] + 1;
    }
    currentNetwork = new vistorian.Network(id);
    currentNetwork.name = 'New Network ' + currentNetwork.id;
    storage.saveNetwork(currentNetwork);
    $('#chooseNetworktype').css('display', 'block');
    $('#networkTables').css('display', 'none');
}
function setNodeTable(list) {
    var tableName = list.value;
    if (tableName != '---') {
        var table = storage.getUserTable(tableName);
        currentNetwork.userNodeTable = table;
        console.log('currentNetwork.userNodeTable', currentNetwork.userNodeTable);
        showTable(table, '#nodeTableDiv', false, currentNetwork.userNodeSchema);
    }
    else {
        unshowTable('#nodeTableDiv');
        currentNetwork.userNodeTable = undefined;
    }
}
function setLinkTable(list) {
    var tableName = list.value;
    if (tableName != '---') {
        var table = storage.getUserTable(tableName);
        currentNetwork.userLinkTable = table;
        showTable(table, '#linkTableDiv', false, currentNetwork.userLinkSchema);
    }
    else {
        unshowTable('#linkTableDiv');
        currentNetwork.userLinkTable = undefined;
    }
}
function setLocationTable(list) {
    var tableName = list.value;
    if (tableName != '---') {
        var table = storage.getUserTable(tableName);
        currentNetwork.userLocationTable = table;
        currentNetwork.userLocationSchema = new networkcube.LocationSchema(0, 1, 2, 3, 4);
        showTable(table, '#locationTableDiv', true, currentNetwork.userLocationSchema);
    }
    else {
        unshowTable('#locationTableDiv');
        currentNetwork.userLocationTable = undefined;
    }
}
function saveCurrentNetwork(failSilently) {
    console.log('Save current network');
    var networkcubeDataSet;
    saveCellChanges();
    if (currentNetwork.networkCubeDataSet == undefined) {
        networkcubeDataSet = new networkcube.DataSet({
            name: currentNetwork.name,
            nodeTable: [],
            linkTable: [],
            locationTable: []
        });
        currentNetwork.networkCubeDataSet = networkcubeDataSet;
    }
    else {
        networkcubeDataSet = currentNetwork.networkCubeDataSet;
    }
    currentNetwork.name = $('#networknameInput').val();
    currentNetwork.networkCubeDataSet.name = $('#networknameInput').val();
    if (currentNetwork.userNodeSchema.time != -1) {
        currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userNodeSchema.name).val();
    }
    if (currentNetwork.userLinkSchema.time != -1) {
        currentNetwork.timeFormat = $('#timeFormatInput_' + currentNetwork.userLinkSchema.name).val();
    }
    checkTimeFormatting(currentNetwork);
    if (!currentNetwork.userNodeTable && !currentNetwork.userLinkTable) {
        if (!failSilently)
            showMessage("Cannot save without a Node table or a Link Table", 2000);
        return;
    }
    if (currentNetwork.userNodeTable)
        vistorian.cleanTable(currentNetwork.userNodeTable.data);
    if (currentNetwork.userLinkTable)
        vistorian.cleanTable(currentNetwork.userLinkTable.data);
    var normalizedNodeTable = [];
    var normalizedLinkTable = [];
    var normalizedLocationTable = [];
    var networkcubeNodeSchema = currentNetwork.networkCubeDataSet.nodeSchema;
    var networkcubeLinkSchema = currentNetwork.networkCubeDataSet.linkSchema;
    var networkcubeLocationSchema = currentNetwork.networkCubeDataSet.locationSchema;
    var locationLabels = [];
    if (currentNetwork.userLocationTable != undefined) {
        for (var i = 1; i < currentNetwork.userLocationTable.data.length; i++) {
            locationLabels.push(currentNetwork.userLocationTable.data[i][currentNetwork.userLocationSchema.label]);
        }
    }
    console.log('locationLabels', locationLabels);
    var nodeIds = [];
    var names = [];
    var nodeLocations = [];
    var nodeTimes = [];
    if (currentNetwork.userNodeTable == undefined) {
        console.log('no node table found, create node table');
        var linkData = currentNetwork.userLinkTable.data;
        var id_source;
        var id_target;
        var name;
        var loc;
        var linkSchema = currentNetwork.userLinkSchema;
        var timeString;
        var timeFormatted;
        for (var i = 1; i < linkData.length; i++) {
            name = linkData[i][linkSchema.source];
            if (names.indexOf(name) < 0) {
                id_source = nodeIds.length;
                names.push(name);
                nodeIds.push(id_source);
                nodeLocations.push([]);
                nodeTimes.push([]);
            }
            name = linkData[i][linkSchema.target];
            if (names.indexOf(name) < 0) {
                id_target = nodeIds.length;
                names.push(name);
                nodeIds.push(id_target);
                nodeLocations.push([]);
                nodeTimes.push([]);
            }
        }
        normalizedLinkTable = [];
        var linkTime;
        var found = true;
        for (var i = 0; i < linkData.length; i++) {
            normalizedLinkTable.push([]);
            for (var j = 0; j < linkData[i].length; j++) {
                normalizedLinkTable[i].push(linkData[i][j]);
            }
            if (networkcube.isValidIndex(linkSchema.source)) {
                normalizedLinkTable[i][linkSchema.source] = nodeIds[names.indexOf(linkData[i][linkSchema.source])];
            }
            if (networkcube.isValidIndex(linkSchema.target)) {
                normalizedLinkTable[i][linkSchema.target] = nodeIds[names.indexOf(linkData[i][linkSchema.target])];
            }
            id_source = names.indexOf(linkData[i][linkSchema.source]);
            id_target = names.indexOf(linkData[i][linkSchema.target]);
            if (id_source == -1 || id_target == -1)
                continue;
            if (linkSchema.location_source > -1) {
                loc = linkData[i][linkSchema.location_source].trim();
                id = locationLabels.indexOf(loc);
                if (id == -1)
                    continue;
                found = false;
                for (var t = 0; t < nodeTimes[id_source].length; t++) {
                    if (nodeTimes[id_source][t] == linkData[i][linkSchema.time]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    nodeTimes[id_source].push(linkData[i][linkSchema.time]);
                    nodeLocations[id_source].push(id);
                }
                normalizedLinkTable[i][linkSchema.location_source] = id;
            }
            if (linkSchema.location_target > -1) {
                loc = linkData[i][linkSchema.location_target].trim();
                id = locationLabels.indexOf(loc);
                if (id == -1)
                    continue;
                console.log('source_location id: ', loc, id_target, id);
                found = false;
                for (var t = 0; t < nodeTimes[id_target].length; t++) {
                    if (nodeTimes[id_target][t] == linkData[i][linkSchema.time]) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    nodeTimes[id_target].push(linkData[i][linkSchema.time]);
                    nodeLocations[id_target].push(id);
                }
                normalizedLinkTable[i][linkSchema.location_target] = id;
            }
        }
        normalizedLinkTable.shift();
        var time;
        normalizedNodeTable = [];
        networkcubeNodeSchema.label = 1;
        var locationsFound = false;
        var timeFound = false;
        if (nodeLocations.length > 0) {
            networkcubeNodeSchema.location = 4;
        }
        if (nodeTimes.length > 0) {
            networkcubeNodeSchema.location = 3;
        }
        for (var i = 0; i < nodeIds.length; i++) {
            if (nodeLocations[i].length > 0) {
                locationsFound = true;
                for (var j = 0; j < nodeLocations[i].length; j++) {
                    time = undefined;
                    if (nodeTimes[i][j]) {
                        time = nodeTimes[i][j].toString();
                    }
                    normalizedNodeTable.push([nodeIds[i], names[i], nodeTimes[i][j], nodeLocations[i][j]]);
                }
            }
            else {
                if (networkcube.isValidIndex(currentNetwork.userNodeSchema.time)) {
                    normalizedNodeTable.push([nodeIds[i], names[i], undefined, undefined]);
                }
                else {
                    normalizedNodeTable.push([nodeIds[i], names[i], undefined]);
                }
            }
        }
    }
    if (currentNetwork.userNodeTable) {
        networkcubeNodeSchema = new networkcube.NodeSchema(0);
        networkcubeNodeSchema.id = currentNetwork.userNodeSchema.id;
        networkcubeNodeSchema.label = currentNetwork.userNodeSchema.label;
        if (networkcube.isValidIndex(currentNetwork.userNodeSchema.time)) {
            networkcubeNodeSchema.time = currentNetwork.userNodeSchema.time;
        }
        if (networkcube.isValidIndex(currentNetwork.userNodeSchema.location)) {
            networkcubeNodeSchema.location = currentNetwork.userNodeSchema.location;
        }
        if (networkcube.isValidIndex(currentNetwork.userNodeSchema.nodeType)) {
            networkcubeNodeSchema.nodeType = currentNetwork.userNodeSchema.nodeType;
        }
    }
    else {
        networkcubeNodeSchema = new networkcube.NodeSchema(0);
        networkcubeNodeSchema.id = 0;
        networkcubeNodeSchema.label = 1;
        if (networkcube.isValidIndex(currentNetwork.userLinkSchema.time)) {
            networkcubeNodeSchema.time = 2;
        }
        if (networkcube.isValidIndex(currentNetwork.userLinkSchema.location_source) || networkcube.isValidIndex(currentNetwork.userLinkSchema.location_target)) {
            networkcubeNodeSchema.location = 3;
        }
    }
    if (currentNetwork.userLinkTable == undefined) {
        console.log('Create and fill link table');
        var nodeData = currentNetwork.userNodeTable.data;
        console.log('nodeData', nodeData);
        var nodeSchema = currentNetwork.userNodeSchema;
        var id;
        var relCol;
        var newRow;
        var nodeId;
        var newNodeId = nodeData.length + 1;
        networkcubeLinkSchema.linkType = 3;
        if (networkcube.isValidIndex(nodeSchema.time))
            networkcubeLinkSchema.time = 4;
        for (var i = 1; i < nodeData.length; i++) {
            newRow = [];
            id = parseInt(nodeData[i][nodeSchema.id]);
            while (normalizedNodeTable.length < (id + 1)) {
                normalizedNodeTable.push([]);
            }
            newRow.push(id);
            newRow.push(nodeData[i][nodeSchema.label]);
            normalizedNodeTable[id] = newRow;
        }
        networkcubeNodeSchema.label = 1;
        console.log('Create new links: ' + (nodeData.length * nodeSchema.relation.length), nodeData, nodeSchema.relation);
        for (var i = 1; i < nodeData.length; i++) {
            for (var j = 0; j < nodeSchema.relation.length; j++) {
                relCol = nodeSchema.relation[j];
                if (nodeData[i][relCol].length == 0)
                    continue;
                nodeId = -1;
                for (var k = 0; k < normalizedNodeTable.length; k++) {
                    if (normalizedNodeTable[k][1] == nodeData[i][relCol]) {
                        nodeId = k;
                        break;
                    }
                }
                if (nodeId < 0) {
                    nodeId = normalizedNodeTable.length;
                    newRow = [];
                    newRow.push(nodeId);
                    newRow.push(nodeData[i][relCol]);
                    newRow.push(undefined);
                    newRow.push(undefined);
                    normalizedNodeTable.push(newRow);
                }
                newRow = [];
                newRow.push(normalizedLinkTable.length);
                newRow.push(parseInt(nodeData[i][nodeSchema.id]));
                newRow.push(nodeId);
                newRow.push(nodeData[0][relCol]);
                if (nodeSchema.time > -1)
                    newRow.push(nodeData[i][nodeSchema.time]);
                normalizedLinkTable.push(newRow);
            }
        }
        console.log('normalizedLinkTable', normalizedLinkTable);
    }
    if (currentNetwork.userLinkTable) {
        for (var field in currentNetwork.userLinkSchema) {
            if (field == 'name')
                continue;
            networkcubeLinkSchema[field] = currentNetwork.userLinkSchema[field];
        }
    }
    if (currentNetwork.hasOwnProperty('timeFormat') && currentNetwork.timeFormat != undefined && currentNetwork.timeFormat.length > 0) {
        var format = currentNetwork.timeFormat;
        if (networkcubeLinkSchema.time != undefined && networkcubeLinkSchema.time > -1) {
            for (var i = 0; i < normalizedLinkTable.length; i++) {
                time = moment(normalizedLinkTable[i][networkcubeLinkSchema.time], format).format(networkcube.timeFormat());
                if (time.indexOf('Invalid') > -1)
                    time = undefined;
                normalizedLinkTable[i][networkcubeLinkSchema.time] = time;
            }
        }
        if (networkcubeNodeSchema.time != undefined && networkcubeNodeSchema.time > -1) {
            for (var i = 0; i < normalizedNodeTable.length; i++) {
                time = moment(normalizedNodeTable[i][networkcubeNodeSchema.time], format).format(networkcube.timeFormat());
                if (time.indexOf('Invalid') > -1)
                    time = undefined;
                normalizedNodeTable[i][networkcubeNodeSchema.time] = time;
            }
        }
    }
    if (currentNetwork.userLocationTable) {
        currentNetwork.networkCubeDataSet.locationTable = currentNetwork.userLocationTable.data.slice(0);
        currentNetwork.networkCubeDataSet.locationTable.shift();
        currentNetwork.networkCubeDataSet.locationSchema = currentNetwork.userLocationSchema;
    }
    currentNetwork.networkCubeDataSet.nodeTable = normalizedNodeTable;
    currentNetwork.networkCubeDataSet.linkTable = normalizedLinkTable;
    currentNetwork.networkCubeDataSet.linkSchema = networkcubeLinkSchema;
    currentNetwork.networkCubeDataSet.nodeSchema = networkcubeNodeSchema;
    console.log('locationTable', currentNetwork.networkCubeDataSet.locationTable);
    storage.saveNetwork(currentNetwork);
    networkcube.setDataManagerOptions({ keepOnlyOneSession: true });
    console.log('>> START IMPORT');
    networkcube.importData(SESSION_NAME, currentNetwork.networkCubeDataSet);
    console.log('>> IMPORTED: ', currentNetwork.networkCubeDataSet);
    loadNetworkList();
}
function deleteCurrentNetwork() {
    storage.deleteNetwork(currentNetwork);
    unshowNetwork();
    loadNetworkList();
}
function showNetwork(networkId) {
    unshowNetwork();
    $('#noNetworkTables').css('display', 'none');
    console.log('networkId', networkId);
    currentNetwork = storage.getNetwork(networkId);
    if (currentNetwork == null)
        return;
    $('#individualTables').css('display', 'none');
    $('#networkTables').css('display', 'inline');
    $('#networknameInput').val(currentNetwork.name);
    var tables = storage.getUserTables();
    $('#nodetableSelect').append('<option class="tableSelection">---</option>');
    $('#linktableSelect').append('<option class="tableSelection">---</option>');
    $('#locationtableSelect').append('<option class="tableSelection">---</option>');
    $('#nodeTableContainer').css('display', 'inline');
    $('#linkTableContainer').css('display', 'inline');
    if (currentNetwork.networkConfig.indexOf('node') > -1) {
        $('#linkTableContainer').css('display', 'none');
    }
    if (currentNetwork.networkConfig.indexOf('link') > -1) {
        $('#nodeTableContainer').css('display', 'none');
    }
    if (currentNetwork.networkConfig == undefined) {
        $('#linkTableContainer').css('display', 'none');
        $('#nodeTableContainer').css('display', 'none');
    }
    tables.forEach(function (t) {
        $('#nodetableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>');
        $('#linktableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>');
        $('#locationtableSelect')
            .append('<option value="' + t.name + '">' + t.name + '</option>');
    });
    if (currentNetwork.userNodeTable) {
        showTable(currentNetwork.userNodeTable, '#nodeTableDiv', false, currentNetwork.userNodeSchema);
        $('#nodetableSelect').val(currentNetwork.userNodeTable.name);
    }
    if (currentNetwork.userLinkTable) {
        showTable(currentNetwork.userLinkTable, '#linkTableDiv', false, currentNetwork.userLinkSchema);
        $('#linktableSelect').val(currentNetwork.userLinkTable.name);
    }
    if (currentNetwork.userLocationTable) {
        showTable(currentNetwork.userLocationTable, '#locationTableDiv', true, currentNetwork.userLocationSchema);
        $('#locationtableSelect').val(currentNetwork.userLocationTable.name);
    }
    $('#tileViewLink').attr('href', 'sites/tileview.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name.split(' ').join('___'));
    $('#mat-nlViewLink').attr('href', 'sites/mat-nl.html?session=' + SESSION_NAME + '&datasetName=' + currentNetwork.name.split(' ').join('___'));
}
function unshowNetwork() {
    $('#noNetworkTables').css('display', 'block');
    $('#nodetableSelect').empty();
    $('#linktableSelect').empty();
    $('#locationtableSelect').empty();
    unshowTable('#linkTableDiv');
    unshowTable('#nodeTableDiv');
    unshowTable('#locationTableDiv');
    $('#networkTables').css('display', 'none');
    $('#tileViewLink').attr('href', 'tileview.html?session=' + SESSION_NAME);
    $('#mat-nlViewLink').attr('href', 'mat-nl.html?session=' + SESSION_NAME);
}
function unshowTable(elementName) {
    $(elementName).empty();
}
var currentTable;
function showSingleTable(tableName) {
    currentTable = storage.getUserTable(tableName);
    showTable(currentTable, '#individualTable', false);
    $('#individualTables').css('display', 'inline');
    $('#networkTables').css('display', 'none');
    $('#noNetworkTables').css('display', 'none');
}
var currentTableId;
var currentCell;
function showTable(table, elementName, isLocationTable, schema) {
    var tHead, tBody;
    currentTable = table;
    $(elementName).empty();
    var tableId = 'datatable_' + table.name;
    currentTableId = tableId;
    $('#' + tableId).remove();
    var tableDiv = $('<div id="div_' + tableId + '"></div>');
    $(elementName).append(tableDiv);
    var tableMenu = $(elementName).prev();
    tableMenu.find('.tableMenuButton').remove();
    var data = table.data;
    if (data.length > DATA_TABLE_MAX_LENGTH) {
        var info = $('<p>Table shows first 200 rows out of ' + data.length + ' rows in total.</p>');
        tableDiv.append(info);
    }
    var csvExportButton = $('<button class="tableMenuButton" onclick="exportCurrentTableCSV(\'' + table.name + '\')">Export as CSV</button>');
    tableMenu.append(csvExportButton);
    var extractLocationCoordinatesButton;
    if (isLocationTable) {
        tableMenu.append($('<button class="tableMenuButton" onclick="updateLocations()">Update location coordinates</button>'));
    }
    else {
        tableMenu.append($('<button class="tableMenuButton" onclick="extractLocations()">Extract locations</button>'));
    }
    var tab = $('<table id="' + tableId + '">');
    tableDiv.append(tab);
    tab.addClass('datatable stripe hover cell-border and order-column compact');
    tHead = $('<thead>');
    tab.append(tHead);
    var tr = $('<tr></tr>').addClass('tableheader');
    tHead.append(tr);
    for (var c = 0; c < data[0].length; c++) {
        var td = $('<th></th>').addClass('th').attr('contenteditable', 'false');
        tr.append(td);
        td.html(data[0][c]);
    }
    tBody = $('<tbody></tbody>');
    tab.append(tBody);
    for (var r = 1; r < Math.min(data.length, DATA_TABLE_MAX_LENGTH); r++) {
        tr = $('<tr></tr>').addClass('tablerow');
        tBody.append(tr);
        for (var c = 0; c < data[r].length; c++) {
            td = $('<td></td>').attr('contenteditable', 'true');
            td.data('row', r);
            td.data('column', c);
            td.data('table', table);
            tr.append(td);
            td.html(data[r][c]);
            td.blur(function () {
                console.log('td.blur');
                if ($(this).html().length == 0) {
                    $(this).addClass('emptyTableCell');
                }
                else {
                    $(this).removeClass('emptyTableCell');
                }
            });
            td.focusin(function (e) {
                console.log('td.focusin');
                saveCellChanges();
                currentCell = $(this);
            });
            td.focusout(function (e) {
                console.log('td.focusout');
                saveCellChanges();
            });
            if (typeof data[r][c] == 'string' && data[r][c].trim().length == 0)
                td.addClass('emptyTableCell');
        }
    }
    var dtable = $('#' + tableId).DataTable({
        "autoWidth": true
    });
    dtable.columns.adjust().draw();
    if (schema) {
        console.log('Schema', schema);
        var schemaRow = $('<tr class="schemaRow"></tr>');
        $('#' + tableId + ' > thead').append(schemaRow);
        var select, cell, option, timeFormatInput;
        for (var i = 0; i < table.data[0].length; i++) {
            cell = $('<th class="schemaCell" id="schemaCell_' + schema.name + '_' + i + '"></th>');
            schemaRow.append(cell);
            select = $('<select class="schemaSelection" onchange="schemaSelectionChanged(this.value, ' + i + ' , \'' + schema.name + '\')"></select>');
            cell.append(select);
            select.append('<option>(Not visualized)</option>');
            for (var field in schema) {
                if (field == 'name'
                    || field == 'constructor'
                    || field == 'timeFormat')
                    continue;
                var fieldName = '';
                switch (field) {
                    case 'source':
                        fieldName = 'Source Node';
                        break;
                    case 'target':
                        fieldName = 'Target Node';
                        break;
                    case 'location_source':
                        fieldName = 'Source Node Location';
                        break;
                    case 'location_target':
                        fieldName = 'Target Node Location';
                        break;
                    case 'linkType':
                        fieldName = 'Link Type';
                        break;
                    case 'location':
                        fieldName = 'Node Location';
                        break;
                    case 'label':
                        fieldName = 'Node';
                        break;
                    default:
                        fieldName = field;
                        fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                }
                option = $('<option value=' + field + '>' + fieldName + '</option>');
                select.append(option);
                if (i == 0 && field == 'id') {
                    $(option).attr('selected', 'selected');
                    schema[field] = 0;
                }
                if (schema[field] == i) {
                    $(option).attr('selected', 'selected');
                    if (field == 'time') {
                        var val = '';
                        if (currentNetwork.hasOwnProperty('timeFormat')) {
                            val = "value='" + currentNetwork.timeFormat + "'";
                        }
                        timeFormatInput = $('<span class="nobr"><input title="Enter a date pattern" type="text" size="12" id="timeFormatInput_' + schema.name + '" placeholder="DD/MM/YYYY" ' + val + '"></input><a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank" title="Details of the date pattern syntax"><img src="logos/help.png" class="inlineicon"/></a></span>');
                        cell.append(timeFormatInput);
                    }
                }
                if (field == 'relation') {
                    for (var k = 0; k < schema.relation.length; k++) {
                        if (schema.relation[k] == i) {
                            $(option).attr('selected', 'selected');
                        }
                    }
                }
            }
        }
    }
}
function deleteCurrentTable() {
    storage.deleteTable(currentTable);
    $('#individualTables').css('display', 'none');
    loadTableList();
}
function schemaSelectionChanged(field, columnNumber, schemaName, parent) {
    console.log('schemaSelectionChanged', field, columnNumber, schemaName);
    for (var field2 in currentNetwork[schemaName]) {
        if (field2 == 'relation' && currentNetwork[schemaName][field2].indexOf(columnNumber) > -1) {
            var arr = currentNetwork[schemaName][field];
            currentNetwork[schemaName][field2].slice(arr.indexOf(columnNumber), 0);
        }
        else {
            if (currentNetwork[schemaName][field2] == columnNumber) {
                console.log('set ', field2, 'to -1');
                currentNetwork[schemaName][field2] = -1;
            }
        }
    }
    if (field == 'relation') {
        currentNetwork[schemaName][field].push(columnNumber);
    }
    else if (field != '---') {
        currentNetwork[schemaName][field] = columnNumber;
    }
    console.log("currentNetwork[schemaName]", currentNetwork[schemaName]);
    saveCurrentNetwork(false);
    showNetwork(currentNetwork.id);
}
function checkTimeFormatting(network) {
    console.log('checkTimeFormatting');
    var corruptedNodeTimes = [];
    if (network.userNodeTable && network.userNodeTable && network.userNodeSchema && network.userNodeSchema['timeFormat']) {
        corruptedNodeTimes = vistorian.checkTime(network.userNodeTable, network.userNodeSchema['time'], network.userNodeSchema['timeFormat']);
        console.log('corruptedTimes', corruptedNodeTimes);
    }
    var corruptedLinkTimes = [];
    if (network.userLinkTable && network.userLinkSchema && network.userLinkSchema['timeFormat']) {
        corruptedLinkTimes = vistorian.checkTime(network.userLinkTable, network.userLinkSchema['time'], network.userLinkSchema['timeFormat']);
        console.log('corruptedTimes', corruptedLinkTimes);
    }
    return false;
}
function removeRow(row) {
}
var filesToUpload = [];
function getFileInfos(e) {
    filesToUpload = [];
    var files = e.target.files;
    console.log('upload', files.length, 'files');
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        if (f.name.split('.')[1] != 'csv') {
            showMessage("Uploaded file is not a .csv file. Please chose another file.", 4000);
            return;
        }
        else {
            filesToUpload.push(f);
        }
    }
    uploadFiles();
}
function uploadFiles() {
    vistorian.loadCSV(filesToUpload, function () {
        loadTableList();
    });
}
function exportCurrentTableCSV(tableName) {
    saveCellChanges();
    var table = null;
    if (tableName) {
        if (currentNetwork.userLinkTable && currentNetwork.userLinkTable.name == tableName)
            table = currentNetwork.userLinkTable;
        else if (currentNetwork.userNodeTable && currentNetwork.userNodeTable.name == tableName)
            table = currentNetwork.userNodeTable;
        else if (currentNetwork.userLocationTable && currentNetwork.userLocationTable.name == tableName)
            table = currentNetwork.userLocationTable;
    }
    if (!table) {
        table = currentTable;
    }
    vistorian.exportTableCSV(table);
}
function replaceCellContents(tableId) {
    var replace_pattern = $('#div_' + tableId + ' #replace_pattern').val();
    var replace_value = $('#div_' + tableId + ' #replace_value').val();
    console.log('replace_pattern', replace_pattern);
    console.log('replace_value', replace_value);
    var arr;
    if (tableId.startsWith('datatable_'))
        tableId = tableId.slice(10, tableId.length);
    var table = storage.getUserTable(tableId);
    if (table == undefined) {
        table = currentNetwork.userLocationTable;
    }
    if (table.data) {
        arr = table.data;
    }
    else {
        arr = table;
    }
    console.log('table', table);
    var replaceCount = 0;
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            if (isNaN(arr[i][j])) {
                if (arr[i][j].indexOf(replace_pattern) > -1) {
                    arr[i][j] = arr[i][j].replace(replace_pattern, replace_value).trim();
                    replaceCount++;
                }
            }
            else {
                if (arr[i][j] == replace_pattern) {
                    arr[i][j] = replace_value;
                    replaceCount++;
                }
            }
        }
    }
    table.data = arr;
    saveCellChanges();
    saveCurrentNetwork(false);
    showMessage('Replaced ' + replaceCount + ' occurrences of ' + replace_pattern + ' with ' + replace_value + '.', 2000);
}
function extractLocations() {
    showMessage('Extracting locations...', false);
    if (currentNetwork.userLocationTable == undefined) {
        var tableName = currentNetwork.name.replace(/ /g, "_");
        currentNetwork.userLocationTable = new vistorian.VTable(tableName + '-locations', []);
        currentNetwork.userLocationSchema = new networkcube.LocationSchema(0, 1, 2, 3, 4);
        currentNetwork.userLocationTable.data.push(['Id', 'User Label', 'Geo Name', 'Longitude', 'Latitude']);
        storage.saveUserTable(currentNetwork.userLocationTable);
        tables = storage.getUserTables();
    }
    var locationTable = currentNetwork.userLocationTable;
    var locationSchema = currentNetwork.userLocationSchema;
    if (locationTable.data.length == 0) {
        var schemaStrings = [];
        locationTable.data.push(['Id', 'User Label', 'Geoname', 'Longitude', 'Latitude']);
    }
    var locationsFound = 0;
    if (networkcube.isValidIndex(currentNetwork.userNodeSchema.location)) {
        var nodeTable = currentNetwork.userNodeTable.data;
        if (nodeTable != undefined) {
            for (var i = 1; i < nodeTable.length; i++) {
                createLocationEntry(linkTable[i][currentNetwork.userNodeSchema.location], locationTable.data);
            }
        }
    }
    if (networkcube.isValidIndex(currentNetwork.userLinkSchema.location_source)) {
        var linkTable = currentNetwork.userLinkTable.data;
        if (linkTable != undefined) {
            for (var i = 1; i < linkTable.length; i++) {
                createLocationEntry(linkTable[i][currentNetwork.userLinkSchema.location_target], locationTable.data);
            }
        }
    }
    if (networkcube.isValidIndex(currentNetwork.userLinkSchema.location_target)) {
        if (linkTable != undefined) {
            for (var i = 1; i < linkTable.length; i++) {
                createLocationEntry(linkTable[i][currentNetwork.userLinkSchema.location_target], locationTable.data);
            }
        }
    }
    locationsFound = locationTable.data.length;
    saveCurrentNetwork(false);
    showNetwork(currentNetwork.id);
    if (locationsFound > 0)
        showMessage(locationsFound + ' locations extracted successfully.', 2000);
    else
        showMessage('In order to extract locations, you must specify which columns are locations in your node and link tables.', 2000);
}
function createLocationEntry(name, rows) {
    if (name == undefined
        || name.length == 0)
        return;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i][1].length == name.length
            && rows[i][1].indexOf(name) > -1)
            return;
    }
    rows.push([rows.length - 1, name, name, undefined, undefined]);
}
function updateLocations() {
    showMessage('Retrieving and updating location coordinates...', false);
    vistorian.updateLocationTable(currentNetwork.userLocationTable, currentNetwork.networkCubeDataSet.locationSchema, function (nothingImportant) {
        console.log('currentNetwork.userLocationTable', currentNetwork.userLocationTable.data);
        saveCurrentNetwork(false);
        showNetwork(currentNetwork.id);
        showMessage('Locations updated successfully!', 2000);
    });
}
var msgBox;
function showMessage(message, timeout) {
    if ($('.messageBox'))
        $('.messageBox').remove();
    msgBox = $('<div class="messageBox"></div>');
    msgBox.append('<div><p>' + message + '</p></div>');
    $('body').append(msgBox);
    msgBox.click(function () {
        $('.messageBox').remove();
    });
    if (timeout) {
        window.setTimeout(function () {
            $('.messageBox').fadeOut(1000);
        }, timeout);
    }
}
function saveCellChanges() {
    if (currentCell == undefined)
        return;
    var selectedCell_row = currentCell.data('row'), selectedCell_col = currentCell.data('column'), data = currentCell.data('table').data, value;
    console.log('saveCellChanges', selectedCell_row, selectedCell_col);
    if (selectedCell_row != undefined && selectedCell_col != undefined) {
        value = currentCell.text().trim();
        data[selectedCell_row][selectedCell_col] = value;
    }
    currentCell = undefined;
}
function clearCache() {
    unshowNetwork();
    var ids = storage.getNetworkIds();
    ids.forEach(function (id) {
        storage.deleteNetworkById(id);
    });
    var tables = storage.getUserTables();
    tables.forEach(function (t) {
        storage.deleteTable(t);
    });
    $('#tableList').empty();
    $('#networkList').empty();
    showMessage('Cache cleared', 2000);
}
function removeNetwork(networkId) {
    currentNetwork = storage.getNetwork(networkId);
    deleteCurrentNetwork();
}
function removeTable(tableId) {
    var table = storage.getUserTable(tableId);
    storage.deleteTable(table);
    unshowTable('#individualTables');
    loadTableList();
}
function exportNetwork(networkId) {
    vistorian.exportNetwork(storage.getNetwork(networkId));
}
function setNetworkConfig(string) {
    currentNetwork.networkConfig = string;
    $('#chooseNetworktype').css('display', 'none');
    storage.saveNetwork(currentNetwork);
    loadNetworkList();
    showNetwork(currentNetwork.id);
}
