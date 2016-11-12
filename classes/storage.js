var storage;
(function (storage) {
    var SESSION_TABLENAMES = "vistorian.tablenames";
    var SESSION_TABLE = "vistorian.table";
    var SESSION_NETWORK = "vistorian.network";
    var SESSION_NETWORKIDS = "vistorian.networkIds";
    var SESSION_SESSIONID = "vistorian.lastSessionId";
    var SEP = "#";
    function saveSessionId() {
        console.log('save session', SESSION_NAME);
        $.jStorage.set(SESSION_SESSIONID, SESSION_NAME);
    }
    storage.saveSessionId = saveSessionId;
    function getLastSessionId() {
        var session = $.jStorage.get(SESSION_SESSIONID);
        console.log('get session, ', session);
        return session;
    }
    storage.getLastSessionId = getLastSessionId;
    function saveUserTable(table) {
        console.log('[vistorian] Save user table', table.name);
        var tableNames = getTableNames();
        var found = false;
        if (!tableNames) {
            tableNames = [];
        }
        else {
            tableNames.forEach(function (tableName) {
                if (tableName == table.name) {
                    found = true;
                }
            });
        }
        if (!found) {
            console.log('\tTable', table.name, 'not found. Table added.');
            tableNames.push(table.name);
            saveTableNames(tableNames);
        }
        else {
            console.log('\tTable', table.name, 'found. Replace table');
        }
        $.jStorage.set(SESSION_NAME + SEP + SESSION_TABLE + SEP + table.name, table);
        console.log('\tTable', table.name, 'added.', getTableNames().length + ' tables stored.');
    }
    storage.saveUserTable = saveUserTable;
    function getUserTables() {
        var tablenames = this.getTableNames();
        var tables = [];
        for (var i = 0; i < tablenames.length; i++) {
            tables.push($.jStorage.get(SESSION_NAME + SEP + SESSION_TABLE + SEP + tablenames[i]));
        }
        return tables;
    }
    storage.getUserTables = getUserTables;
    function getUserTable(tablename) {
        return $.jStorage.get(SESSION_NAME + SEP + SESSION_TABLE + SEP + tablename);
    }
    storage.getUserTable = getUserTable;
    function getTableNames() {
        var names = $.jStorage.get(SESSION_NAME + SEP + SESSION_TABLENAMES);
        if (names == undefined)
            names = [];
        return names;
    }
    storage.getTableNames = getTableNames;
    function saveTableNames(tableNames) {
        $.jStorage.set(SESSION_NAME + SEP + SESSION_TABLENAMES, tableNames);
    }
    storage.saveTableNames = saveTableNames;
    function deleteTable(table) {
        console.log('delete table', table);
        $.jStorage.deleteKey(SESSION_NAME + SEP + SESSION_TABLE + SEP + table.name);
        var tableNames = getTableNames();
        var found = false;
        if (!tableNames) {
            tableNames = [];
        }
        else {
            tableNames.forEach(function (tableName) {
                if (tableName == table.name) {
                    found = true;
                }
            });
        }
        if (found) {
            tableNames.splice(tableNames.indexOf(table.name), 1);
            saveTableNames(tableNames);
        }
        console.log('table deleted', getTableNames());
    }
    storage.deleteTable = deleteTable;
    function saveNetwork(network) {
        var networkIds = getNetworkIds();
        var found = false;
        if (!networkIds) {
            networkIds = [];
        }
        else {
            networkIds.forEach(function (networkId) {
                if (networkId == network.id) {
                    found = true;
                }
            });
        }
        if (!found) {
            networkIds.push(network.id);
            saveNetworkIds(networkIds);
        }
        console.log('save network', network);
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORK + SEP + network.id, network);
        console.log('GET network', getNetwork(network.id));
    }
    storage.saveNetwork = saveNetwork;
    function getNetworkIds() {
        var ids = $.jStorage.get(SESSION_NAME + SEP + SESSION_NETWORKIDS);
        if (ids == undefined)
            ids = [];
        return ids;
    }
    storage.getNetworkIds = getNetworkIds;
    function saveNetworkIds(networkIds) {
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORKIDS, networkIds);
    }
    storage.saveNetworkIds = saveNetworkIds;
    function getNetwork(networkId) {
        return $.jStorage.get(SESSION_NAME + SEP + SESSION_NETWORK + SEP + networkId);
    }
    storage.getNetwork = getNetwork;
    function deleteNetwork(network) {
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORK + SEP + network.id, {});
        $.jStorage.deleteKey(SESSION_NAME + SEP + SESSION_NETWORK + SEP + network.id);
        var networkIds = getNetworkIds();
        var found = false;
        if (!networkIds) {
            networkIds = [];
        }
        else {
            networkIds.forEach(function (networkId) {
                if (networkId == network.id) {
                    found = true;
                }
            });
        }
        if (found) {
            networkIds.splice(networkIds.indexOf(network.id), 1);
            saveNetworkIds(networkIds);
        }
        console.log('[storage] Network removed', getNetworkIds().length, 'networks remaining.');
    }
    storage.deleteNetwork = deleteNetwork;
})(storage || (storage = {}));
