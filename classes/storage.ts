/// <reference path="../scripts/jstorage.d.ts"/>
/// <reference path="./vistorian.ts"/>

module storage{


    var SESSION_TABLENAMES:string = "vistorian.tablenames";
    var SESSION_TABLE:string = "vistorian.table";
    var SESSION_NETWORK:string = "vistorian.network";
    var SESSION_NETWORKIDS:string = "vistorian.networkIds";
    var SESSION_SESSIONID:string = "vistorian.lastSessionId";

    var SEP:string = "#";



    // SESSION
    export function saveSessionId(){
        console.log('save session', SESSION_NAME )
        $.jStorage.set(SESSION_SESSIONID, SESSION_NAME);
    }

    export function getLastSessionId():string{
        var session:string = $.jStorage.get<string>(SESSION_SESSIONID);
        console.log('get session, ', session)
        return session;
    }



    // TABLES

    // Stores all user's tables (tables must be in json format)
    export function saveUserTable(table){
        console.log('[vistorian] Save user table', table.name);

        // add name to table names if not yet there.
        var tableNames:string[] = getTableNames();
        var found = false;
        if(!tableNames){
            tableNames = [];
        }else{
            tableNames.forEach(tableName => {
                if(tableName == table.name){
                    found = true;
                }
            })
        }
        if(!found){
            console.log('\tTable', table.name, 'not found. Table added.')
            tableNames.push(table.name);
            saveTableNames(tableNames);
        }else{
            console.log('\tTable', table.name, 'found. Replace table')
        }
        $.jStorage.set(SESSION_NAME + SEP + SESSION_TABLE + SEP + table.name, table);
        console.log('\tTable', table.name, 'added.', getTableNames().length + ' tables stored.')

    }

    // returns all users' tables
    export function getUserTables():vistorian.VTable[]{

        var tablenames:string[] = this.getTableNames();
        var tables:vistorian.VTable[] = [];
        for(var i=0 ; i<tablenames.length ; i++){
            tables.push($.jStorage.get<vistorian.VTable>(SESSION_NAME + SEP + SESSION_TABLE + SEP + tablenames[i]));
        }
        return tables;
    }

    export function getUserTable(tablename:string):vistorian.VTable{
        return $.jStorage.get<vistorian.VTable>(SESSION_NAME + SEP + SESSION_TABLE + SEP + tablename)
    }

    export function getTableNames():string[]{
        var names:string[] = $.jStorage.get<string[]>(SESSION_NAME + SEP + SESSION_TABLENAMES);
        if(names == undefined)
            names = []
        return names;
}
    export function saveTableNames(tableNames){
        $.jStorage.set(SESSION_NAME + SEP + SESSION_TABLENAMES, tableNames);
    }
    export function deleteTable(table:vistorian.VTable){
        $.jStorage.deleteKey(SESSION_NAME + SEP + SESSION_TABLE + SEP + table.name);

        var tableNames:string[] = getTableNames();
        var found = false;
        if(!tableNames){
            tableNames = [];
        }else{
            tableNames.forEach(tableName => {
                if(tableName == table.name){
                    found = true;
                }
            })
        }
        if(found){
            tableNames.splice(tableNames.indexOf(table.name), 1);
            saveTableNames(tableNames);
        }
        console.log('table deleted', getTableNames());
    }


    // NETWORKS

    export function saveNetwork(network:vistorian.Network){

        // add name to table names if not yet there.
        var networkIds:number[] = getNetworkIds();
        var found = false;
        if(!networkIds){
            networkIds = [];
        }else{
            networkIds.forEach(networkId => {
                if(networkId == network.id){
                    found = true;
                }
            })
        }
        if(!found){
            networkIds.push(network.id);
            saveNetworkIds(networkIds);
        }
        console.log('save network', network)
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORK + SEP + network.id, network);
        console.log('GET network', getNetwork(network.id))

    }
    export function getNetworkIds():number[]{
        var ids:number[] = $.jStorage.get<number[]>(SESSION_NAME + SEP + SESSION_NETWORKIDS);
        if(ids == undefined)
            ids = []
        return ids;
    }
    export function saveNetworkIds(networkIds){
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORKIDS, networkIds);
    }

    export function getNetwork(networkId:number):vistorian.Network{
        return $.jStorage.get<vistorian.Network>(SESSION_NAME + SEP + SESSION_NETWORK + SEP + networkId);
    }

    export function deleteNetwork(network:vistorian.Network){
        deleteNetworkById(network.id);
    }
    export function deleteNetworkById(id:number){
        $.jStorage.set(SESSION_NAME + SEP + SESSION_NETWORK + SEP + id, {});
        $.jStorage.deleteKey(SESSION_NAME + SEP + SESSION_NETWORK + SEP + id);

        var networkIds = getNetworkIds();
        var found = false;
        if(!networkIds){
            networkIds = [];
        }else{
            networkIds.forEach(networkId => {
                if(networkId == id){
                    found = true;
                }
            })
        }
        if(found){
            networkIds.splice(networkIds.indexOf(id),1);
            saveNetworkIds(networkIds);
        }
        // console.log('[storage] Network removed', getNetworkIds().length, 'networks remaining.');
    }
}
