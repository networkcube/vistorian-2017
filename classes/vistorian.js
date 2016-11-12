var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vistorian;
(function (vistorian) {
    var head = $('head');
    head.append("<link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300italic,700,300&subset=latin,latin-ext' rel='stylesheet' type='text/css'></head>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Great+Vibes' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Playfair+Display' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Amatic+SC:400,700' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Lora' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Comfortaa' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=Caveat' rel='stylesheet' type='text/css'>");
    head.append("<link href='https://fonts.googleapis.com/css?family=IM+Fell+English' rel='stylesheet' type='text/css'>");
    function append(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        $("head").append(script);
    }
    var tables = [];
    var VTable = (function () {
        function VTable(name, data) {
            this.name = name;
            this.data = data;
        }
        return VTable;
    })();
    vistorian.VTable = VTable;
    var VTableSchema = (function () {
        function VTableSchema(name) {
            this.name = name;
        }
        return VTableSchema;
    })();
    vistorian.VTableSchema = VTableSchema;
    var VNodeSchema = (function (_super) {
        __extends(VNodeSchema, _super);
        function VNodeSchema() {
            _super.call(this, 'userNodeSchema');
            this.relation = [];
            this.location = -1;
            this.id = 0;
            this.label = -1;
            this.time = -1;
            this.nodeType = -1;
        }
        ;
        return VNodeSchema;
    })(VTableSchema);
    vistorian.VNodeSchema = VNodeSchema;
    var VLinkSchema = (function (_super) {
        __extends(VLinkSchema, _super);
        function VLinkSchema() {
            _super.call(this, 'userLinkSchema');
            this.location_source = -1;
            this.location_target = -1;
            this.id = 0;
            this.source = -1;
            this.target = -1;
            this.weight = -1;
            this.time = -1;
            this.linkType = -1;
        }
        ;
        return VLinkSchema;
    })(VTableSchema);
    vistorian.VLinkSchema = VLinkSchema;
    var VLocationSchema = (function (_super) {
        __extends(VLocationSchema, _super);
        function VLocationSchema() {
            _super.call(this, 'userLocationSchema');
            this.id = 0;
            this.label = 1;
            this.geoname = 2;
            this.longitude = 3;
            this.latitude = 4;
        }
        ;
        return VLocationSchema;
    })(VTableSchema);
    vistorian.VLocationSchema = VLocationSchema;
    var Network = (function () {
        function Network(id) {
            this.networkConfig = 'both';
            this.id = id;
            this.userNodeSchema = new VNodeSchema();
            this.userLinkSchema = new VLinkSchema();
        }
        return Network;
    })();
    vistorian.Network = Network;
    function loadCSV(files, callBack) {
        var loadCount = 0;
        var table;
        var tables = [];
        var fileContents = [];
        var readers = [];
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();
            reader.filename = f.name.split('_')[0];
            readers[i] = reader;
            reader.onload = function (f) {
                var obj = {
                    content: f.target.result,
                    name: f.target.filename
                };
                var i = readers.indexOf(f.target);
                fileContents[i] = obj;
                table = new VTable(files[i].name.replace('.csv', '').replace(' ', '_').trim(), Papa.parse(fileContents[i].content).data);
                formatTable(table);
                storage.saveUserTable(table);
                loadCount++;
                console.log(loadCount, files.length);
                if (loadCount == files.length)
                    callBack();
            };
            reader.readAsText(f);
        }
    }
    vistorian.loadCSV = loadCSV;
    function exportTableCSV(table) {
        var csv = Papa.unparse(table.data, { quotes: true });
        var textFileAsBlob = new Blob([csv], { type: 'text/csv' });
        var fileNameToSaveAs = table.name + '.csv';
        var downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        downloadLink.click();
    }
    vistorian.exportTableCSV = exportTableCSV;
    function exportLocationTableCSV(networkname, table) {
        var csv = Papa.unparse(table, { quotes: true });
        var textFileAsBlob = new Blob([csv], { type: 'text/csv' });
        var fileNameToSaveAs = networkname + '-locations.csv';
        var downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        downloadLink.click();
    }
    vistorian.exportLocationTableCSV = exportLocationTableCSV;
    function formatTable(table) {
        var data = [];
        var indexify = !(table.data[0][0] == 'ID'
            || table.data[0][0] == 'id'
            || table.data[0][0] == 'Id'
            || table.data[0][0] == 'Index'
            || table.data[0][0].includes('index')
            || table.data[0][0].includes('Index'));
        var numCols = table.data[0].length;
        var emptyCols = 0;
        var row;
        for (var i = 0; i < table.data.length; i++) {
            row = [];
            emptyCols = 0;
            if (indexify) {
                if (i == 0)
                    row.push('Index');
                else
                    row.push((i - 1) + '');
            }
            for (var j = 0; j < numCols; j++) {
                if (table.data[i][j] == undefined) {
                    table.data[i][j] = '';
                }
                if (table.data[i][j].length == 0) {
                    emptyCols++;
                }
                row.push(table.data[i][j].trim());
            }
            if (emptyCols < numCols - 1) {
                data.push(row);
            }
        }
        table.data = data;
        return table;
    }
    vistorian.formatTable = formatTable;
    function checkTime(table, timeCol, timeFormat) {
        var timeString;
        var error = [];
        console.log('table', table);
        for (var i = 0; i < table.data.length; i++) {
            timeString = table.data[i][timeCol];
            if (timeString.length == 0) {
                error.push(i);
                continue;
            }
            try {
                moment(timeString, timeFormat);
            }
            catch (err) {
                error.push(i);
            }
        }
        return error;
    }
    vistorian.checkTime = checkTime;
    var requestTimer;
    var requestsRunning = 0;
    var fullGeoNames = [];
    function updateLocationTable(userLocationTable, locationSchema, callBack) {
        saveCurrentNetwork(false);
        var data = userLocationTable.data;
        requestsRunning = 0;
        fullGeoNames = [];
        for (var i = 1; i < data.length; i++) {
            console.log('send update request ', data[i][locationSchema.geoname]);
            updateEntryToLocationTableOSM(i, data[i][locationSchema.geoname], userLocationTable, locationSchema);
        }
        requestTimer = setInterval(function () {
            currentNetwork.userLocationTable = userLocationTable;
            checkRequests(callBack, []);
        }, 500);
    }
    vistorian.updateLocationTable = updateLocationTable;
    function checkRequests(callBack, locationsFound) {
        if (requestsRunning == 0) {
            clearInterval(requestTimer);
            callBack(locationsFound);
        }
    }
    function updateEntryToLocationTableOSM(index, geoname, locationTable, locationSchema) {
        geoname = geoname.trim();
        fullGeoNames.push(geoname);
        var xhr = $.ajax({
            url: "https://nominatim.openstreetmap.org/search",
            data: { format: "json", limit: "1", q: geoname.split(',')[0].trim() },
            dataType: 'json'
        })
            .done(function (data, text, XMLHttpRequest) {
            var entry;
            var length;
            var rowIndex = XMLHttpRequest.uniqueId + 1;
            var userLocationLabel = locationTable.data[rowIndex][locationSchema.label];
            if (data.length != 0) {
                var validResults = [];
                var result;
                for (var i = 0; i < data.length; i++) {
                    entry = data[i];
                    if (entry == undefined)
                        continue;
                    if ('lon' in entry &&
                        'lat' in entry &&
                        typeof entry.lon === 'string' &&
                        typeof entry.lat === 'string') {
                        validResults.push(entry);
                    }
                }
                if (validResults.length == 0) {
                    locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                    return;
                }
                locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, validResults[0].lon, validResults[0].lat];
            }
            else {
                if (geoname == '')
                    return;
                locationTable.data[rowIndex] = [rowIndex - 1, userLocationLabel, geoname, undefined, undefined];
                console.log('update', geoname, undefined, undefined);
            }
        })
            .always(function () {
            requestsRunning--;
        });
        xhr['uniqueId'] = requestsRunning++;
    }
    function cleanTable(table) {
        for (var i = 0; i < table.length; i++) {
            for (var j = 0; j < table.length; j++) {
                if (table[i][j] != undefined)
                    table[i][j] = table[i][j].trim();
            }
        }
    }
    vistorian.cleanTable = cleanTable;
    function setHeader(elementId, datasetname) {
        var header = $('<a href="../index.html"><img width="100%" src="../logos/logo2.png"/></a>');
        $('#' + elementId).append(header);
        var dataname = $('\
        <p style="margin:5px;background-color:#eeeeee;border-radius:2px;padding-left:10px;padding:5px;"><b>Data:</b> ' + datasetname + '</h2>');
        $('#' + elementId).append(dataname);
        $('#' + elementId).append('<a href="../dataview.html" style="margin:5px;padding-left:5px;">Return to Dataview</a>');
        $('#' + elementId).append('<br/><br/>');
    }
    vistorian.setHeader = setHeader;
    function exportNetwork(network) {
        var nodeTable = network.networkCubeDataSet.nodeTable;
        var nodeSchema = network.networkCubeDataSet.nodeSchema;
        var nodes = [];
        var n;
        for (var i = 0; i < nodeTable.length; i++) {
            n = new Object();
            for (var prop in nodeSchema) {
                if (!prop.startsWith('name') && nodeSchema[prop] != null)
                    n[prop] = nodeTable[i][nodeSchema[prop]];
            }
            nodes.push(n);
        }
        var linkTable = network.networkCubeDataSet.linkTable;
        var linkSchema = network.networkCubeDataSet.linkSchema;
        var links = [];
        var n;
        for (var i = 0; i < linkTable.length; i++) {
            n = new Object();
            for (var prop in linkSchema) {
                if (!prop.startsWith('name') && linkSchema[prop] != null)
                    n[prop] = linkTable[i][linkSchema[prop]];
            }
            links.push(n);
        }
        var blurb = {
            nodes: nodes,
            links: links
        };
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(blurb)));
        element.setAttribute('download', network.name + '.networkcube');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    vistorian.exportNetwork = exportNetwork;
})(vistorian || (vistorian = {}));
