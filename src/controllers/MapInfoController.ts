import { BaseScreep, SourceUserScreep } from "$creeps/BaseScreep";
import _, { curryRight, Dictionary, List } from "lodash";
import { RoomInfo, SourceData } from "types/misc/RoomInfo";

var rooms: List<string> = [
    "W2N5"
]
const ECONOMY_HISTORY = 50;
var roomInfos: Dictionary<RoomInfo>;
export class MapInfoController {
    public static cleanData() : void{
        roomInfos = {};
        for (let i = 0; i < rooms.length; i++) {
            var newRoomInfo = new RoomInfo(rooms[i]);
            roomInfos[rooms[i]] = newRoomInfo;
        }
        
    }

    public static updateMapData() : void{

        MapInfoController.storeEnergyState();

        for (let i = 0; i < rooms.length; i++) {
            var sources = Game.rooms[rooms[i]].find(FIND_SOURCES);
            var currentRoomInfo = roomInfos[rooms[i]];
            sources.forEach(currentSource => {
                var newSourceData = new SourceData(currentSource.id);
                currentRoomInfo.sourceDict[currentSource.id] = newSourceData;
                newSourceData.currentHarvesters = 0;
                newSourceData.currentStaticHarvesters = 0;
                let roomNextToSource = MapInfoController.walkableTilesAroundTile(currentSource.room.name, currentSource.pos.x, currentSource.pos.y);
                newSourceData.maxHarvesters = roomNextToSource;
                
            });

            var structures = Game.rooms[rooms[i]].find(FIND_STRUCTURES);
            structures.forEach(currentStructure => {
                if (currentRoomInfo.structureDict[currentStructure.structureType] == null) {
                    currentRoomInfo.structureDict[currentStructure.structureType] = [];
                }
                currentRoomInfo.structureDict[currentStructure.structureType].push(currentStructure);
            });

            var containerData = Memory.containerData;
            
            if (containerData == null) {
                containerData = new ContainerData();
            }
            var allContainers = structures.filter(x=> x.structureType == STRUCTURE_CONTAINER) as StructureContainer[];
            allContainers.forEach(currContainer => {

                if (currentRoomInfo.structureDict["container"].length > 0) {
                    currentRoomInfo.structureDict["container"].forEach(currentStructure => {
                        var currentContainer = currentStructure as StructureContainer;
                        if (!MapInfoController.containerIsAlreadyRegistered(containerData, currentContainer)) {
                            for (let sourceInfoKey in currentRoomInfo.sourceDict) {
                                var source = Game.getObjectById(currentRoomInfo.sourceDict[sourceInfoKey].id);
                                var isInRangeForStaticHarvesting = currentContainer.pos.inRangeTo(source.pos.x, source.pos.y, 2);
                                if (isInRangeForStaticHarvesting) {
                                    containerData.sourceStorage[sourceInfoKey] = currentContainer.id;
                                }
                            }
                            var room = Game.rooms[rooms[i]];
                            var spawns = room.find(FIND_STRUCTURES, { filter: (structure) => {  return structure.structureType == STRUCTURE_SPAWN } });
    
                            var isInRangeForBaseStorage = currentContainer.pos.inRangeTo(spawns[0].pos.x, spawns[0].pos.y, 5);
                            if (isInRangeForBaseStorage) {
                                containerData.baseStorage.push(currentContainer.id);
                            }
    
                            var isInRangeForUpgraderStorage = currentContainer.pos.inRangeTo(room.controller.pos.x, room.controller.pos.y, 4);
                            if (isInRangeForUpgraderStorage) {
                                containerData.controllerUpgradeStorage.push(currentContainer.id);
                            }
                        }
                    });
                }
            });
            Memory.containerData = containerData;
        }
    }

    public static economyGrowth(room: string) : number{
        let ret = 0;
        if (Memory.energyStates[room] && Memory.energyStates[room].length >= ECONOMY_HISTORY) {
            var totalGrowth = 0;
            for (let i = 1; i < Memory.energyStates[room].length; i++) {
                let lastAmount = Memory.energyStates[room][i-1];
                let amount = Memory.energyStates[room][i];
                if (amount == Game.rooms[room].energyCapacityAvailable) {
                    return Number.MAX_SAFE_INTEGER;
                }
                let growth = amount - lastAmount;
                if (growth > 0) {
                    totalGrowth += growth;
                }
                return totalGrowth;
            }
        }
        return ret;
        
    }

    public static storeEnergyState(){
        if (!Memory.energyStates) {
            Memory.energyStates = {};
        }
        for (let i = 0; i < rooms.length; i++) {
            var currentRoom = rooms[i];
            if (Memory.energyStates[currentRoom] == null) {
                Memory.energyStates[currentRoom] = [];
            }
            Memory.energyStates[currentRoom].push(Game.rooms[currentRoom].energyAvailable);
            if (Memory.energyStates[currentRoom].length > ECONOMY_HISTORY) {
                let toRemove = Memory.energyStates[currentRoom].length - ECONOMY_HISTORY;
                Memory.energyStates[currentRoom].splice(0, toRemove);
            }
        }
    }

    public static walkableTilesAroundTile(room: string, posX:number, posY: number) : number {
        var terrain = Game.rooms[room].getTerrain();
        var ret = 0;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x != 0 || y != 0){
                    var tile = terrain.get(posX + x, posY + y);
                    if (tile != TERRAIN_MASK_WALL){
                        ret++;
                    }
                }
            }
        }
        return ret;
        
    }

    public static updateRoleData() : void{
        for (let i = 0; i < rooms.length; i++) {
            for (const key in roomInfos[rooms[i]].screepRoles) {
                roomInfos[rooms[i]].screepRoles[key] = 0;
            }
        }
        
        for (let key in Game.creeps) {
            let currScreep = Game.creeps[key];

            //update role amount
            if  (currScreep.memory.role != null && currScreep.memory.origin != null){
                if (roomInfos[currScreep.memory.origin].screepRoles[currScreep.memory.role] == null){
                    roomInfos[currScreep.memory.origin].screepRoles[currScreep.memory.role] = 0;
                }
                roomInfos[currScreep.memory.origin].screepRoles[currScreep.memory.role]++;
            }
        }
    }

    public static updateHarvesterData(screeps: BaseScreep[]) : void{
        
        for (let index = 0; index < screeps.length; index++) {
            let currScreep = screeps[index];
            if  (currScreep.memory.role == "HarvesterRunner" || currScreep.memory.role == "Upgrader"){
                var screepScript = currScreep as SourceUserScreep;
                var sourceId = screepScript.memory.sourceId;
                if  (sourceId != null && sourceId != undefined && sourceId.length > 0){
                    roomInfos[screepScript.memory.origin].sourceDict[sourceId].currentHarvesters += 1;
                    
                }
            }else if (currScreep.memory.role == "StaticHarvester"){
                var screepScript = currScreep as SourceUserScreep;
                var sourceId = screepScript.memory.sourceId;
                if  (sourceId != null && sourceId != undefined && sourceId.length > 0){
                    roomInfos[screepScript.memory.origin].sourceDict[sourceId].currentStaticHarvesters += 1;
                }
            }
        }
    }

    public static getRoomScreepInfo(roomName: string) : RoomInfo{
        return roomInfos[roomName];
    }

    public static containerIsAlreadyRegistered(containerData: ContainerData, container: StructureContainer) : boolean{
        for (const key in containerData.sourceStorage) {
            if (containerData.sourceStorage[key] == container.id) {
                return true;
            }
        }
        return containerData.controllerUpgradeStorage.includes(container.id) || containerData.baseStorage.includes(container.id)
    }
}



export class ContainerData{
    sourceStorage: {[key: Id<Source>] : Id<StructureContainer>};
    baseStorage: Id<StructureContainer>[];
    controllerUpgradeStorage: Id<StructureContainer>[];
    constructor() {
        this.sourceStorage = {};
        this.baseStorage = [];
        this.controllerUpgradeStorage = [];
    }
}